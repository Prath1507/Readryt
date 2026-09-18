import os
import json
import tkinter as tk
from PIL import Image, ImageTk


IMAGE_FOLDER = r"E:\readryt\ReadRyt\training-data\recognition\images"
OUTPUT_FILE = r"E:\readryt\ReadRyt\training-data\recognition\rupee-annotations.json"


class Annotator:
    def __init__(self, root):
        self.root = root

        self.files = [
            f
            for f in os.listdir(IMAGE_FOLDER)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
        ]

        self.files.sort()

        self.index = 0
        self.annotations = {}

        if os.path.exists(OUTPUT_FILE):
            with open(
                OUTPUT_FILE,
                "r",
                encoding="utf-8"
            ) as file:
                self.annotations = json.load(file)

        self.image = None
        self.photo = None

        self.scale = 1
        self.start_x = None
        self.start_y = None
        self.rect = None

        self.canvas = tk.Canvas(
            root,
            width=1100,
            height=550,
            bg="white"
        )

        self.canvas.pack()

        self.info = tk.Label(
            root,
            text=""
        )

        self.info.pack()

        self.save_button = tk.Button(
            root,
            text="Save & Next",
            command=self.save_and_next
        )

        self.save_button.pack(pady=10)

        self.canvas.bind(
            "<ButtonPress-1>",
            self.start_box
        )

        self.canvas.bind(
            "<B1-Motion>",
            self.draw_box
        )

        self.canvas.bind(
            "<ButtonRelease-1>",
            self.finish_box
        )

        self.load_image()

    def load_image(self):

        if self.index >= len(self.files):
            self.finish()
            return

        filename = self.files[self.index]

        path = os.path.join(
            IMAGE_FOLDER,
            filename
        )

        self.image = Image.open(path)

        original_width, original_height = self.image.size

        max_width = 1000
        max_height = 450

        self.scale = min(
            max_width / original_width,
            max_height / original_height,
            1
        )

        display_width = int(
            original_width * self.scale
        )

        display_height = int(
            original_height * self.scale
        )

        resized = self.image.resize(
            (display_width, display_height)
        )

        self.photo = ImageTk.PhotoImage(resized)

        self.canvas.delete("all")

        self.canvas.config(
            width=display_width,
            height=display_height
        )

        self.canvas.create_image(
            0,
            0,
            anchor="nw",
            image=self.photo
        )

        self.info.config(
            text=f"[{self.index + 1}/{len(self.files)}] "
                 f"Draw a box around ONLY the ₹ symbol: {filename}"
        )

        self.start_x = None
        self.start_y = None
        self.rect = None

    def start_box(self, event):

        self.start_x = event.x
        self.start_y = event.y

        if self.rect:
            self.canvas.delete(self.rect)

        self.rect = self.canvas.create_rectangle(
            self.start_x,
            self.start_y,
            event.x,
            event.y,
            outline="red",
            width=2
        )

    def draw_box(self, event):

        if self.start_x is None:
            return

        self.canvas.coords(
            self.rect,
            self.start_x,
            self.start_y,
            event.x,
            event.y
        )

    def finish_box(self, event):
        pass

    def save_and_next(self):

        if self.rect is None:
            return

        coords = self.canvas.coords(
            self.rect
        )

        x1, y1, x2, y2 = coords

        x1, x2 = sorted([x1, x2])
        y1, y2 = sorted([y1, y2])

        original_x1 = int(
            x1 / self.scale
        )

        original_y1 = int(
            y1 / self.scale
        )

        original_x2 = int(
            x2 / self.scale
        )

        original_y2 = int(
            y2 / self.scale
        )

        filename = self.files[self.index]

        self.annotations[filename] = {
            "text": "₹",
            "box": [
                original_x1,
                original_y1,
                original_x2,
                original_y2
            ]
        }

        with open(
            OUTPUT_FILE,
            "w",
            encoding="utf-8"
        ) as file:
            json.dump(
                self.annotations,
                file,
                ensure_ascii=False,
                indent=2
            )

        self.index += 1

        self.load_image()

    def finish(self):

        self.info.config(
            text="All annotations completed."
        )

        self.save_button.config(
            state="disabled"
        )


root = tk.Tk()

root.title(
    "ReadRyt ₹ Symbol Annotation"
)

Annotator(root)

root.mainloop()