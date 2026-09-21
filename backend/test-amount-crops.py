from PIL import Image
from paddleocr import PaddleOCR


tests = [
    {
        "name": "90",
        "image": r"C:\Users\info\Downloads\90.jpeg",
        "box": [619, 160, 696, 208],
    },
    {
        "name": "400",
        "image": r"C:\Users\info\Downloads\400.jpeg",
        "box": [213, 254, 481, 364],
    },
]


ocr = PaddleOCR(lang="hi")


for test in tests:
    image = Image.open(test["image"])

    x1, y1, x2, y2 = test["box"]

    # Add a little padding around the amount.
    padding = 10

    x1 = max(0, x1 - padding)
    y1 = max(0, y1 - padding)
    x2 = min(image.width, x2 + padding)
    y2 = min(image.height, y2 + padding)

    crop = image.crop((x1, y1, x2, y2))

    crop_path = f"backend/amount-{test['name']}.png"
    crop.save(crop_path)

    print("\n==============================")
    print(f"Testing ₹{test['name']}")
    print(f"Crop saved: {crop_path}")
    print("==============================")

    result = ocr.predict(crop_path)

    for res in result:
        print("Recognized:", res["rec_texts"])