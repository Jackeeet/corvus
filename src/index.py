import base64
import faulthandler
import os

import webview

from corvus.element_detector import detect_text
from corvus.ocr import recognize_text


class Api:
    def detect_text_areas(self, filepaths):
        return detect_text(filepaths)

    def recognize_text_strings(self, filepaths, box_data=None):
        return recognize_text(filepaths, None, box_data)

    def open_file_dialog(self):
        file_types = ("Image files (*.jpg;*.png;*.bmp;*.tif)", "All files (*.*)")
        filepaths = webview.windows[0].create_file_dialog(
            webview.OPEN_DIALOG, allow_multiple=True, file_types=file_types
        )

        if filepaths is None:
            return []

        files = []
        for filepath in filepaths:
            filename = os.path.basename(filepath)
            with open(filepath, 'rb') as file:
                image = base64.b64encode(file.read())
                files.append({"name": filename, "path": filepath, "data": image.decode()})
        return files

    # def save_content(self, content):
    #     filename = webview.windows[0].create_file_dialog(webview.SAVE_DIALOG)
    #     if not filename:
    #         return
    #
    #     with open(filename[0], 'w') as f:
    #         f.write(content)

    # def fullscreen(self):
    #     webview.windows[0].toggle_fullscreen()

    # def ls(self):
    #     return os.listdir('.')


def get_entrypoint():
    def exists(path):
        return os.path.exists(os.path.join(os.path.dirname(__file__), path))

    if exists('../gui/index.html'):  # unfrozen development
        return '../gui/index.html'

    if exists('../Resources/gui/index.html'):  # frozen py2app
        return '../Resources/gui/index.html'

    if exists('./gui/index.html'):
        return './gui/index.html'

    raise Exception('No index.html found')


entry = get_entrypoint()

if __name__ == '__main__':
    # faulthandler.enable()
    window = webview.create_window(
        'corvus', entry, js_api=Api(), frameless=False, maximized=True
    )
    # webview.start(debug=True)
    webview.start(debug=False)
