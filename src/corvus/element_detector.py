import json
import os
import cv2
import base64

import numpy as np

from paddleocr import TextDetection, PPStructureV3

# a less accurate but more stable version
# from paddleocr import PPStructure, draw_structure_result, save_structure_res

# element_detector = PPStructure(
#     layout=False,
#     show_log=True
# )

text_detector = TextDetection(model_name="PP-OCRv5_mobile_det")


# comment this for debug purposes, as setting up w/ PPStructure takes a long time

# element_detector = PPStructureV3(
#     use_formula_recognition=False,
#     use_chart_recognition=False,
#     use_seal_recognition=False,
#     use_doc_orientation_classify=False,
#     use_doc_unwarping=False,
#     use_region_detection=False,
# )


def _draw_bboxes(image_path: str, box_data, color=None, debug=False):
    image = cv2.imread(image_path)
    name, ext = os.path.splitext(image_path)
    name = name.split('\\')[-1].strip()
    font_scale = 0.25 if name == "1" else 1
    if not color:
        color = [(0, 255, 0) for _ in box_data]
    if debug:
        save_path = r"C:\dev\corvus\output\debug" + f"\\{name}{ext}"
        for i, poly_set in enumerate(box_data):
            for j, poly in enumerate(poly_set):
                cv2.rectangle(image, poly[0], poly[2], (j * 2, j * 2, 0), 2)
                cv2.putText(image, str(j), poly[0], cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 0, 255), 1, cv2.LINE_AA)
        print(f"saving to {save_path}")
        cv2.imwrite(save_path, image)
        return

    for i, poly_set in enumerate(box_data):
        for j, poly in enumerate(poly_set):
            cv2.rectangle(image, poly[0], poly[2], color[i], 2)
    success, buffer = cv2.imencode(ext, image)
    if not success:
        raise Exception(f"Could not convert file {image_path} to binary.")
    return base64.b64encode(buffer.tobytes()).decode()


# sorts bboxes by top-left corners' distance from y-axis and then by increasing x-coordinate
# aka top-bottom, left-right.
# if there's a long vertical bbox, it messes up all the rows it spans. But it's ok for now.
def _sort_bboxes(boxes):
    sorted_boxes = []
    boxes_to_search = boxes[:]
    line_height = min(map(lambda b: b[0][1], boxes))
    max_box_height = -1
    while len(boxes_to_search) > 0:
        row_boxes = []
        remaining_boxes = []
        # the remaining boxes approach is not really efficient - if the NN outputs bboxes in roughly
        # y-increasing order, once we find a box that's below the limit, we're on the next row
        for box in boxes_to_search:
            box_top_left = np.array([box[0][0], box[0][1], 0])
            box_height = int(max(box[3][1] - box[0][1], box[2][1] - box[1][1]))
            if len(row_boxes) == 0 or box_top_left[1] <= (line_height + max_box_height // 2):
                row_boxes.append(box)
                max_box_height = box_height if box_height > max_box_height else max_box_height
            else:
                remaining_boxes.append(box)

        sorted_boxes.extend(sorted(row_boxes, key=lambda b: b[0][0]))
        boxes_to_search = remaining_boxes
        max_box_height = -1
        if len(remaining_boxes) > 0:
            line_height = min(map(lambda b: b[0][1], remaining_boxes))
    return sorted_boxes


def detect_text(image_paths: list[str]):
    results = []
    output = text_detector.predict(image_paths)
    for i, res in enumerate(output):
        boxes = _sort_bboxes(res.json['res']['dt_polys'][::-1])
        bbox_image_data = _draw_bboxes(image_paths[i], [boxes])
        box_data = [{
            "x": points[0][0], "y": points[0][1],
            "w": points[2][0] - points[0][0],
            "h": points[2][1] - points[0][1]
        } for points in boxes]
        results.append({"detected": box_data, "image": bbox_image_data})
    return results


# temp version for PP-Structure V2 to avoid memory access error showing up on some images

# def detect_elements(filepaths: list[str]):
#     from src.corvus.utils.v3_style_json_converter import get_v3_style_results
#     for image_path in filepaths:
#         img_name = os.path.basename(image_path).split('.')[0]
#         img = cv2.imread(image_path)
#         result = element_detector(img)
#         save_structure_res(result, '.\\output', img_name)
#         for line in result:
#             parse_results = get_v3_style_results(image_path, line)
#             with open(f".\\output\\{img_name}-result.json", "w", encoding="utf-8") as json_file:
#                 json.dump(parse_results, json_file, indent=4, ensure_ascii=False)
#

# proper PP-Structure V3 version
def detect_elements(filepaths: list[str], debug=False):
    print("starting detection")
    results = []
    if not debug:
        element_detector = PPStructureV3(
            use_formula_recognition=False,
            use_chart_recognition=False,
            use_seal_recognition=False,
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_region_detection=False,
        )
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
            results.append(res)
            res.save_to_json(save_path='.\\output')
            res.save_to_img(save_path='.\\output')
    else:
        res_filepaths = [os.path.join(
            os.path.dirname(path),
            f"{os.path.basename(path).split('.')[0]}_res.json"
        ) for path in filepaths]
        for i, path in enumerate(res_filepaths):
            with open(path, 'r', encoding='utf-8') as file:
                detected = json.load(file)
                cells = []
                for table in detected['table_res_list']:
                    cells.extend(table['cell_box_list'])
                bbox_image_data = _draw_bboxes(
                    filepaths[i], [
                        list(map(lambda d: [
                            (d["block_bbox"][0], d["block_bbox"][1]), None,
                            (d["block_bbox"][2], d["block_bbox"][3])
                        ], detected["parsing_res_list"])),
                        list(map(lambda d: [
                            (round(d[0]), round(d[1])), None,
                            (round(d[2]), round(d[3]))
                        ], cells))
                    ],
                    [(255, 0, 0), (0, 255, 0)]
                )
                results.append({
                    "detected": detected, "image": bbox_image_data
                })
    return results


if __name__ == "__main__":
    detect_elements(["C:\\dev\\corvus\\tables\\IMG_8100.jpg"])
    pass
