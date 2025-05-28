import cv2
import editdistance
import keras

import albumentations as A
import numpy as np
import tensorflow as tf
import tensorflow.python.keras.backend as K
from tensorflow.keras.layers import Layer, Input, Dense, Dropout, \
    Conv2D, MaxPooling2D, Conv2DTranspose, \
    Bidirectional, LSTM, Reshape, \
    BatchNormalization, StringLookup
from tensorflow.keras.models import Model

from .element_detector import detect_text

alphabet = ['а', 'б', 'в', 'г', 'д', 'е', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф',
            'х', 'ц', 'ч', 'ш', 'щ', 'ы', 'ь', 'э', 'ю', 'я', 'ё']
char_to_num = StringLookup(vocabulary=alphabet, mask_token=None)
num_to_char = StringLookup(
    vocabulary=char_to_num.get_vocabulary(), mask_token=None, invert=True
)

max_label_length = 17


@keras.saving.register_keras_serializable()
class CTCLayer(Layer):
    def __init__(self, name=None):
        super().__init__(name=name)
        self.loss_fn = K.ctc_batch_cost

    def call(self, y_true, y_pred):
        batch_len = tf.cast(tf.shape(y_true)[0], dtype="int64")
        input_length = tf.cast(tf.shape(y_pred)[1], dtype="int64")
        label_length = tf.cast(tf.shape(y_true)[1], dtype="int64")

        input_length = input_length * tf.ones(shape=(batch_len, 1), dtype="int64")
        label_length = label_length * tf.ones(shape=(batch_len, 1), dtype="int64")
        loss = self.loss_fn(y_true, y_pred, input_length, label_length)
        self.add_loss(loss)

        return y_pred


def _decode_batch_predictions(pred):
    input_len = np.ones(pred.shape[0]) * pred.shape[1]
    results = K.ctc_decode(pred, input_length=input_len, greedy=True)[0][0][:, :max_label_length]
    output_text = []
    for res in results:
        res = tf.gather(res, tf.where(tf.math.not_equal(res, -1)))
        res = tf.strings.reduce_join(num_to_char(res)).numpy().decode("utf-8")
        output_text.append(res)
    return output_text


def _downscale(image, max_sizes=None):
    # max_width = max_sizes["max_width"] or 128
    # max_height = max_sizes["max_height"] or 32
    max_width = 128
    max_height = 32

    lms_width = A.Compose([A.LongestMaxSize(max_size=max_width, interpolation=cv2.INTER_LINEAR)])
    lms_height = A.Compose([A.LongestMaxSize(max_size=max_height, interpolation=cv2.INTER_LINEAR)])
    sms_width = A.Compose([A.SmallestMaxSize(max_size=max_width, interpolation=cv2.INTER_LINEAR)])
    sms_height = A.Compose([A.SmallestMaxSize(max_size=max_height, interpolation=cv2.INTER_LINEAR)])

    height, width = image.shape[:2]
    # 1 - OK
    if height <= max_height and width <= max_width:
        return image
    # 2 - Too tall and too wide
    if height > max_height and width > max_width:
        image = lms_width(image=image)["image"] if width > height else sms_width(image=image)["image"]
        return _downscale(image)
    # 3 - Too tall
    if height > max_height:
        return sms_height(image=image)["image"] if width > height else lms_height(image=image)["image"]
    # 4 - Too wide (assuming max_width >= max_height)
    return lms_width(image=image)["image"]


def _median_value(image):
    b, g, r = cv2.split(image)
    return np.median(b), np.median(g), np.median(r)


def _pad(image, sizes=None):
    # width = sizes["width"] if sizes else 128
    # height = sizes["height"] if sizes else 32
    width = 128
    height = 32

    h, w, channels = image.shape
    median_color = _median_value(image)
    result = np.full((height, width, channels), median_color, dtype=np.uint8)

    x_center = (width - w) // 2
    y_center = (height - h) // 2

    result[y_center:y_center + h, x_center:x_center + w] = image
    return result


def _preprocess_images(images):
    preprocessed = [_pad(_downscale(image)) for image in images]
    assert all([image.shape[0] == 32 for image in preprocessed])
    assert all([image.shape[1] == 128 for image in preprocessed])
    results = []
    for img in preprocessed:
        image = tf.convert_to_tensor(img, dtype=tf.uint8)
        image = tf.image.rgb_to_grayscale(image)
        image = tf.transpose(image, perm=[1, 0, 2])
        image = tf.image.flip_left_right(image)
        results.append(tf.cast(image, tf.float32) / 255.0)
    return tf.stack(results)


def _build_model():
    inputs = Input(name="image", shape=(128, 32, 1))
    labels = Input(name="label", shape=(None,))
    cnn = Conv2D(
        32, (3, 3), activation="relu", kernel_initializer="he_normal", padding="same", name="cnn1"
    )(inputs)
    cnn = Conv2D(
        64, (3, 3), activation="relu", kernel_initializer="he_normal", padding="same", name="cnn2"
    )(cnn)
    cnn = MaxPooling2D((2, 2), name="mp1")(cnn)
    cnn = BatchNormalization()(cnn)
    cnn = Conv2D(
        128, (3, 3), activation="relu", kernel_initializer="he_normal", padding="same", name="cnn3"
    )(cnn)
    cnn = MaxPooling2D((2, 2), name="mp2")(cnn)
    bs, nw, nh, f = Model(inputs=inputs, outputs=cnn).output_shape
    lstm = Reshape(target_shape=(nw, nh * f), name="reshape")(cnn)
    lstm = Dense(128, activation="relu", name="dense")(lstm)
    lstm = Dropout(0.2)(lstm)
    lstm = Bidirectional(LSTM(units=128, return_sequences=True, dropout=0.25), name="lstm1")(lstm)
    lstm = Bidirectional(LSTM(units=128, return_sequences=True, dropout=0.25), name="lstm2")(lstm)
    lstm = Bidirectional(LSTM(units=64, return_sequences=True, dropout=0.25), name="lstm3")(lstm)

    output = Dense(
        len(char_to_num.get_vocabulary()) + 2,
        activation="softmax", name="dense_output"
    )(lstm)
    output = CTCLayer(name="ctc_loss")(labels, output)
    return inputs, Model(inputs=[inputs, labels], outputs=output)


def _recognize_strings(images):
    # model = keras.models.load_model(
    #     # 'src/corvus/models/best_models_200-3/models/model.keras'
    #     r'C:\dev\corvus\src\corvus\models\best_models_200-3\models\model.keras'
    # )
    inputs, model = _build_model()
    model.load_weights(r'C:\dev\corvus\src\corvus\models\best_models_200-3\models\model.weights.h5')
    prediction_model = Model(
        inputs=inputs,
        outputs=model.get_layer(name="dense_output").output
    )
    predictions = prediction_model.predict(images)
    return _decode_batch_predictions(predictions)


def _correct_text(strings, dictionary):
    processed = []
    for word in strings:
        if ' ' in word:
            result = ''
            parts = word.split()
            for part in parts:
                part = part.strip().lower()
                closest_match = min(
                    dictionary,
                    key=lambda dict_word: editdistance.eval(part, dict_word.lower())
                )
                result += closest_match if editdistance.eval(part, closest_match) < 5 else part
                result += ''
        else:
            part = word.strip().lower()
            closest_match = min(
                dictionary,
                key=lambda dict_word: editdistance.eval(word, dict_word.lower())
            )
            processed.append(closest_match if editdistance.eval(word, closest_match) < 5 else word)
    return processed


def recognize_text(image_paths, dictionary, box_data=None):
    if box_data is None:
        box_data = detect_text(image_paths)
    box_data = [img_results['detected'] for img_results in box_data]

    recognized = []
    for i, image_path in enumerate(image_paths):
        fragments = []
        image = cv2.cvtColor(cv2.imread(image_path), cv2.COLOR_BGR2RGB)
        for p in box_data[i]:
            x, y, w, h = p['x'], p['y'], p['w'], p['h']
            fragments.append(image[y:y + h, x:x + w])
        preprocessed_images = _preprocess_images(fragments)
        strings = _recognize_strings(preprocessed_images)
        corrected_strings = strings
        # corrected_strings = _correct_text(strings, dictionary)
        recognized.append([
            {"string": string, "box": box}
            for string, box in zip(corrected_strings, box_data[i])
        ])
        print(f"appended {image_path}")
    return recognized


if __name__ == "__main__":
    inputs, model = _build_model()
    prediction_model = Model(
        inputs=inputs,
        outputs=model.get_layer(name="dense_output").output
    )
    print(prediction_model.summary())
