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
        boxes = res.json['res']['dt_polys']
        bbox_image_data = _draw_bboxes(image_paths[i], boxes)
        box_data = [{
            "x": points[0][0], "y": points[0][1],
            "w": points[2][0] - points[0][0],
            "h": points[2][1] - points[0][1]
        } for points in boxes]
        results.append({"detected": box_data, "image": bbox_image_data})
    return results


def detect_elements(filepaths: list[str]):
    pass
