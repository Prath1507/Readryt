import os
import json
from PIL import Image


RAW_FOLDER = r"E:\readryt\ReadRyt\training-data\raw"
ANNOTATIONS_FILE = r"E:\readryt\ReadRyt\training-data\annotations.json"

OUTPUT_FOLDER = r"E:\readryt\ReadRyt\training-data\recognition"
IMAGE_FOLDER = os.path.join(OUTPUT_FOLDER, "images")
LABEL_FILE = os.path.join(OUTPUT_FOLDER, "labels.txt")


def main():

    os.makedirs(IMAGE_FOLDER, exist_ok=True)

    with open(
        ANNOTATIONS_FILE,
        "r",
        encoding="utf-8"
    ) as file:
        annotations = json.load(file)

    labels = []

    for filename, annotation in annotations.items():

        image_path = os.path.join(
            RAW_FOLDER,
            filename
        )

        if not os.path.exists(image_path):
            print(
                f"Image not found: {filename}"
            )
            continue

        image = Image.open(image_path)

        x1, y1, x2, y2 = annotation["box"]

        cropped = image.crop(
            (x1, y1, x2, y2)
        )

        output_name = (
            os.path.splitext(filename)[0]
            .replace(" ", "_")
            .replace("(", "")
            .replace(")", "")
            + ".jpg"
        )

        output_path = os.path.join(
            IMAGE_FOLDER,
            output_name
        )

        cropped.convert("RGB").save(
            output_path,
            quality=95
        )

        text = annotation["text"]

        labels.append(
            f"images/{output_name}\t{text}"
        )

        print(
            f"{filename} -> {text}"
        )

    with open(
        LABEL_FILE,
        "w",
        encoding="utf-8"
    ) as file:
        file.write(
            "\n".join(labels)
        )

    print()
    print("Training samples created:", len(labels))
    print("Images:", IMAGE_FOLDER)
    print("Labels:", LABEL_FILE)


if __name__ == "__main__":
    main()