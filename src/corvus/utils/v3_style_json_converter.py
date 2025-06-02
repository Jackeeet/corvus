def get_v3_style_results(image_path, line):
    parsing_res_list = [{
        'block_label': "table",
        'block_content': line['res']['html'],
        'block_bbox': line['bbox']
    }]
    layout_det_res = {
        'input_path': None,
        'page_index': None,
        'boxes': [{'cls_id': 8, 'label': 'table', 'score': 1, 'coordinate': line['bbox']}]
    }
    table_res_list = {
        'cell_box_list': parse_bboxes(line['res']['cell_bbox']),
        'pred_html': line['res']['html'],
        'table_ocr_pred': {'rec_polys': [], 'rec_texts': [], 'rec_scores': [], 'rec_boxes': [], }
    }
    parse_results = {
        "input_path": image_path,
        "page_index": None,
        "model_settings": {
            "use_doc_preprocessor": False,
            "use_seal_recognition": False,
            "use_table_recognition": True,
            "use_formula_recognition": False,
            "use_chart_recognition": False,
            "use_region_detection": False
        },
        "parsing_res_list": parsing_res_list,
        "layout_det_res": layout_det_res,
        "overall_ocr_res": {},
        "table_res_list": table_res_list
    }
    return parse_results


def parse_bboxes(res_polygons):
    bounding_boxes = []
    for poly in res_polygons:
        x_coords = poly[::2]  # Even indices: x0, x1, x2, x3
        y_coords = poly[1::2]  # Odd indices: y0, y1, y2, y3
        x_min = min(x_coords)
        y_min = min(y_coords)
        x_max = max(x_coords)
        y_max = max(y_coords)
        bounding_boxes.append([x_min, y_min, x_max, y_max])
    return bounding_boxes
