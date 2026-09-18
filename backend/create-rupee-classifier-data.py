import os
import json
import random
from PIL import Image, ImageDraw, ImageFont, ImageEnhance


BASE_FOLDER = r"E:\readryt\ReadRyt\training-data\recognition"

ANNOTATIONS_FILE = os.path.join(
    BASE_FOLDER,
    "rupee-annotations.json"
)

IMAGE_FOLDER = os.path.join(
    BASE_FOLDER,
    "images"
)

OUTPUT_FOLDER = os.path.join(
    BASE_FOLDER,
    "rupee-detector"
)

POSITIVE_FOLDER = os.path.join(
    OUTPUT_FOLDER,
    "positive"
)

NEGATIVE_FOLDER = os.path.join(
    OUTPUT_FOLDER,
    "negative"
)


def ensure_folders():
    os.makedirs(POSITIVE_FOLDER, exist_ok=True)
    os.makedirs(NEGATIVE_FOLDER, exist_ok=True)


def load_annotations():
    with open(
        ANNOTATIONS_FILE,
        "r",
        encoding="utf-8"
    ) as file:
        return json.load(file)


def save_image(image, folder, filename):
    path = os.path.join(folder, filename)

    image.convert("RGB").save(
        path,
        quality=95
    )


def create_positive_samples(annotations):
    count = 0

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

        image = Image.open(image_path).convert("RGB")

        x1, y1, x2, y2 = annotation["box"]

        # Small padding around the ₹ symbol.
        width = x2 - x1
        height = y2 - y1

        padding_x = max(2, int(width * 0.10))
        padding_y = max(2, int(height * 0.10))

        x1 = max(0, x1 - padding_x)
        y1 = max(0, y1 - padding_y)
        x2 = min(image.width, x2 + padding_x)
        y2 = min(image.height, y2 + padding_y)

        rupee = image.crop(
            (x1, y1, x2, y2)
        )

        # Normalize size.
        rupee = rupee.resize(
            (64, 96)
        )

        base_name = os.path.splitext(filename)[0]

        save_image(
            rupee,
            POSITIVE_FOLDER,
            f"{base_name}_original.jpg"
        )

        count += 1

        # Create several realistic variations.
        for variation in range(1, 6):

            augmented = rupee.copy()

            # Slight brightness variation.
            brightness = random.uniform(
                0.85,
                1.15
            )

            augmented = ImageEnhance.Brightness(
                augmented
            ).enhance(brightness)

            # Slight contrast variation.
            contrast = random.uniform(
                0.85,
                1.15
            )

            augmented = ImageEnhance.Contrast(
                augmented
            ).enhance(contrast)

            # Slight scaling.
            scale = random.uniform(
                0.90,
                1.10
            )

            new_width = max(
                20,
                int(64 * scale)
            )

            new_height = max(
                30,
                int(96 * scale)
            )

            resized = augmented.resize(
                (new_width, new_height)
            )

            canvas = Image.new(
                "RGB",
                (64, 96),
                "white"
            )

            paste_x = (
                64 - new_width
            ) // 2

            paste_y = (
                96 - new_height
            ) // 2

            canvas.paste(
                resized,
                (paste_x, paste_y)
            )

            save_image(
                canvas,
                POSITIVE_FOLDER,
                f"{base_name}_aug{variation}.jpg"
            )

            count += 1

    return count


def create_real_negative_samples(annotations):
    count = 0

    for filename, annotation in annotations.items():

        image_path = os.path.join(
            IMAGE_FOLDER,
            filename
        )

        if not os.path.exists(image_path):
            continue

        image = Image.open(
            image_path
        ).convert("RGB")

        x1, y1, x2, y2 = annotation["box"]

        # Everything to the RIGHT of ₹ contains
        # the actual digits.
        digit_x1 = x2
        digit_x2 = image.width

        if digit_x2 <= digit_x1:
            continue

        digit_region = image.crop(
            (
                digit_x1,
                max(0, y1 - 5),
                digit_x2,
                min(image.height, y2 + 5)
            )
        )

        if digit_region.width < 5:
            continue

        digit_region = digit_region.resize(
            (96, 96)
        )

        base_name = os.path.splitext(filename)[0]

        save_image(
            digit_region,
            NEGATIVE_FOLDER,
            f"{base_name}_digits.jpg"
        )

        count += 1

    return count


def create_synthetic_digit_samples():
    count = 0

    font_paths = [
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\calibri.ttf",
    ]

    available_fonts = [
        path
        for path in font_paths
        if os.path.exists(path)
    ]

    if not available_fonts:
        print(
            "No Windows fonts found for synthetic negatives."
        )
        return 0

    for font_index, font_path in enumerate(
        available_fonts
    ):

        for digit in "0123456789":

            for size in [48, 56, 64, 72]:

                font = ImageFont.truetype(
                    font_path,
                    size
                )

                image = Image.new(
                    "RGB",
                    (96, 96),
                    "white"
                )

                draw = ImageDraw.Draw(
                    image
                )

                bbox = draw.textbbox(
                    (0, 0),
                    digit,
                    font=font
                )

                text_width = (
                    bbox[2] - bbox[0]
                )

                text_height = (
                    bbox[3] - bbox[1]
                )

                x = (
                    96 - text_width
                ) // 2

                y = (
                    96 - text_height
                ) // 2

                draw.text(
                    (x, y),
                    digit,
                    fill="black",
                    font=font
                )

                filename = (
                    f"digit_{digit}_"
                    f"{font_index}_"
                    f"{size}.jpg"
                )

                save_image(
                    image,
                    NEGATIVE_FOLDER,
                    filename
                )

                count += 1

    return count


def main():

    print(
        "Creating ₹ detector dataset..."
    )

    ensure_folders()

    annotations = load_annotations()

    positive_count = create_positive_samples(
        annotations
    )

    real_negative_count = (
        create_real_negative_samples(
            annotations
        )
    )

    synthetic_negative_count = (
        create_synthetic_digit_samples()
    )

    print()
    print(
        f"Positive samples: {positive_count}"
    )

    print(
        f"Real negative samples: "
        f"{real_negative_count}"
    )

    print(
        f"Synthetic negative samples: "
        f"{synthetic_negative_count}"
    )

    print()
    print(
        "Dataset created successfully."
    )

    print(
        f"Positive: {POSITIVE_FOLDER}"
    )

    print(
        f"Negative: {NEGATIVE_FOLDER}"
    )


if __name__ == "__main__":
    main()