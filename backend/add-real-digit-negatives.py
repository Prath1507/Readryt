import os
import json
import cv2
from PIL import Image


BASE_FOLDER = r"E:\readryt\ReadRyt\training-data\recognition"

ANNOTATIONS_FILE = os.path.join(
    BASE_FOLDER,
    "rupee-annotations.json"
)

IMAGE_FOLDER = os.path.join(
    BASE_FOLDER,
    "images"
)

NEGATIVE_FOLDER = os.path.join(
    BASE_FOLDER,
    "rupee-detector",
    "negative"
)


def normalize_digit(crop):
    """
    Put a digit crop into a standard 64x96 white image.
    """

    if crop.size == 0:
        return None

    height, width = crop.shape[:2]

    if height < 15 or width < 3:
        return None

    # Ignore tiny punctuation/noise.
    if height < 0.35 * width:
        return None

    # Convert to PIL.
    image = Image.fromarray(crop)

    # Preserve aspect ratio.
    max_width = 55
    max_height = 85

    scale = min(
        max_width / image.width,
        max_height / image.height
    )

    new_width = max(
        1,
        int(image.width * scale)
    )

    new_height = max(
        1,
        int(image.height * scale)
    )

    image = image.resize(
        (new_width, new_height)
    )

    canvas = Image.new(
        "L",
        (64, 96),
        255
    )

    x = (64 - new_width) // 2
    y = (96 - new_height) // 2

    canvas.paste(
        image,
        (x, y)
    )

    return canvas.convert("RGB")


def process_amount_crop(
    image_path,
    rupee_box,
    output_prefix
):

    image = cv2.imread(
        image_path,
        cv2.IMREAD_GRAYSCALE
    )

    if image is None:
        return 0

    _, _, x2, y2 = rupee_box

    # Everything to the right of ₹.
    # This is used ONLY for creating training data.
    right = image[
        max(0, rupee_box[1] - 10):
        min(image.shape[0], y2 + 10),
        x2:
    ]

    if right.size == 0:
        return 0

    # Threshold dark characters.
    _, binary = cv2.threshold(
        right,
        210,
        255,
        cv2.THRESH_BINARY_INV
    )

    # Find connected components.
    count, labels, stats, _ = cv2.connectedComponentsWithStats(
        binary,
        connectivity=8
    )

    saved = 0

    for i in range(1, count):

        x = stats[i, cv2.CC_STAT_LEFT]
        y = stats[i, cv2.CC_STAT_TOP]
        w = stats[i, cv2.CC_STAT_WIDTH]
        h = stats[i, cv2.CC_STAT_HEIGHT]
        area = stats[i, cv2.CC_STAT_AREA]

        # Ignore tiny noise.
        if area < 30:
            continue

        # Ignore very small punctuation.
        if h < 20:
            continue

        # Ignore huge regions.
        if h > right.shape[0] * 0.98:
            continue

        component = right[
            max(0, y - 3):
            min(right.shape[0], y + h + 3),
            max(0, x - 3):
            min(right.shape[1], x + w + 3)
        ]

        normalized = normalize_digit(
            component
        )

        if normalized is None:
            continue

        filename = (
            f"{output_prefix}_real_digit_{saved + 1}.jpg"
        )

        output_path = os.path.join(
            NEGATIVE_FOLDER,
            filename
        )

        normalized.save(
            output_path,
            quality=95
        )

        saved += 1

    return saved


def main():

    os.makedirs(
        NEGATIVE_FOLDER,
        exist_ok=True
    )

    with open(
        ANNOTATIONS_FILE,
        "r",
        encoding="utf-8"
    ) as file:
        annotations = json.load(file)

    total = 0

    for filename, annotation in annotations.items():

        image_path = os.path.join(
            IMAGE_FOLDER,
            filename
        )

        if not os.path.exists(image_path):
            print(
                f"Image not found: {filename}"
            )
            continue

        saved = process_amount_crop(
            image_path,
            annotation["box"],
            os.path.splitext(filename)[0]
        )

        print(
            f"{filename} -> "
            f"{saved} real digit samples"
        )

        total += saved

    print()
    print(
        f"Real digit samples added: {total}"
    )

    print(
        f"Negative folder: {NEGATIVE_FOLDER}"
    )


if __name__ == "__main__":
    main()