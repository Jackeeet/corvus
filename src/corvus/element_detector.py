import os
import cv2
import base64

from paddleocr import TextDetection, PPStructureV3

# , TableRecognitionPipelineV2

text_detector = TextDetection(model_name="PP-OCRv5_mobile_det")
element_detector = PPStructureV3(
    # layout=['table', 'ocr', 'kie']
    use_formula_recognition=False,
    use_chart_recognition=False,
    use_seal_recognition=False,
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_region_detection=False,
    # use_table_orientation_classify=False,
    # use_ocr_results_with_table_cells=False,
)


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
    print("starting detection")
    output = element_detector.predict(
        filepaths,
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
        use_table_orientation_classify=False,
        use_seal_recognition=False,
        use_formula_recognition=False,
        use_chart_recognition=False,
        use_region_detection=False,
        use_ocr_results_with_table_cells=False,
    )
    for i, res in enumerate(output):
        res.save_to_json(save_path='.\\output')
        res.save_to_img(save_path='.\\output')
        # print(filepaths[i])
        # print(res)


if __name__ == "__main__":
    detect_elements("C:\\dev\\corvus\\tables\\3.jpg")
