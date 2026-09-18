import os
import json
import tkinter as tk
from tkinter import messagebox
from PIL import Image, ImageTk


RAW_FOLDER = r"E:\readryt\ReadRyt\training-data\raw"
OUTPUT_FILE = r"E:\readryt\ReadRyt\training-data\annotations.json"


class AnnotationTool:
    def __init__(self, root):
        self.root = root
        self.root.title("ReadRyt ₹ Amount Annotation")

        self.files = sorted([
            f
            for f in os.listdir(RAW_FOLDER)
            if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
        ])

        self.index = 0
        self.annotations = {}

        if os.path.exists(OUTPUT_FILE):
            with open(
                OUTPUT_FILE,
                "r",
                encoding="utf-8"
            ) as file:
                self.annotations = json.load(file)

        self.canvas = tk.Canvas(
            root,
            bg="black"
        )
        self.canvas.pack(
            fill=tk.BOTH,
            expand=True
        )

        self.info = tk.Label(
            root,
            text="",
            font=("Arial", 14)
        )
        self.info.pack()

        self.button = tk.Button(
            root,
            text="Save & Next",
            command=self.save_and_next,
            font=("Arial", 12)
        )
        self.button.pack(pady=8)

        self.start_x = None
        self.start_y = None
        self.rect = None

        self.image = None
        self.photo = None

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

        self.current_box = None

        self.load_image()

    def load_image(self):
        if self.index >= len(self.files):
            messagebox.showinfo(
                "Finished",
                "All screenshots have been annotated."
            )
            self.root.destroy()
            return

        filename = self.files[self.index]

        path = os.path.join(
            RAW_FOLDER,
            filename
        )

        self.image = Image.open(path)

        self.display_width = self.image.width
        self.display_height = self.image.height

        max_width = 1100
        max_height = 550

        scale = min(
            max_width / self.image.width,
            max_height / self.image.height,
            1
        )

        self.scale = scale

        display_image = self.image.resize(
            (
                int(self.image.width * scale),
                int(self.image.height * scale)
            )
        )

        self.photo = ImageTk.PhotoImage(
            display_image
        )

        self.canvas.config(
            width=display_image.width,
            height=display_image.height,
            scrollregion=(
                0,
                0,
                display_image.width,
                display_image.height
            )
        )

        self.canvas.delete("all")

        self.canvas.create_image(
            0,
            0,
            anchor="nw",
            image=self.photo
        )

        amount = os.path.splitext(filename)[0]

        # Remove duplicate suffix from filenames such as:
        # 300 (2).jpeg
        # 700 (2).jpeg
        amount = amount.split(" ")[0]

        self.info.config(
            text=(
                f"{self.index + 1}/{len(self.files)}    "
                f"Correct amount: ₹{amount}\n"
                f"Draw a box around the COMPLETE ₹ amount."
            )
        )

        self.current_box = None

    def start_box(self, event):
        self.start_x = event.x
        self.start_y = event.y

        if self.rect:
            self.canvas.delete(self.rect)

        self.rect = self.canvas.create_rectangle(
            self.start_x,
            self.start_y,
            self.start_x,
            self.start_y,
            outline="red",
            width=3
        )

    def draw_box(self, event):
        if self.rect:
            self.canvas.coords(
                self.rect,
                self.start_x,
                self.start_y,
                event.x,
                event.y
            )

    def finish_box(self, event):
        if self.start_x is None:
            return

        x1 = min(
            self.start_x,
            event.x
        )

        y1 = min(
            self.start_y,
            event.y
        )

        x2 = max(
            self.start_x,
            event.x
        )

        y2 = max(
            self.start_y,
            event.y
        )

        self.current_box = [
            round(x1 / self.scale),
            round(y1 / self.scale),
            round(x2 / self.scale),
            round(y2 / self.scale)
        ]

    def save_and_next(self):
        if not self.current_box:
            messagebox.showwarning(
                "No box",
                "Draw a box around the ₹ amount first."
            )
            return

        filename = self.files[self.index]

        amount = os.path.splitext(filename)[0]
        amount = amount.split(" ")[0]

        self.annotations[filename] = {
            "text": f"₹{amount}",
            "box": self.current_box
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


root = tk.Tk()

tool = AnnotationTool(root)

root.mainloop()