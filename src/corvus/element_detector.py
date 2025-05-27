import os
import cv2
import base64

from paddleocr import TextDetection

text_detector = TextDetection(model_name="PP-OCRv5_mobile_det")


def _draw_bboxes(image_path: str, box_data):
    image = cv2.imread(image_path)
    _, ext = os.path.splitext(image_path)
    for poly in box_data:
        cv2.rectangle(image, poly[0], poly[2], (0, 255, 0), 2)
    success, buffer = cv2.imencode(ext, image)
    if not success:
        raise Exception(f"Could not convert file {image_path} to binary.")
    return base64.b64encode(buffer.tobytes()).decode()


def detect_text(image_paths: list[str]):
    results = []
    output = text_detector.predict(image_paths)
    for i, res in enumerate(output):
        bbox_image_data = _draw_bboxes(
            image_paths[i], res.json['res']['dt_polys']
        )
        results.append({"detected": res.json, "image": bbox_image_data})
    return results


def detect_elements(filepaths: list[str]):
    pass
