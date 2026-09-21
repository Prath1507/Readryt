import sys
import json
from paddleocr import PaddleOCR


def run_ocr(ocr, image_path):
    result = ocr.predict(image_path)

    output = {
        "texts": [],
        "scores": [],
        "boxes": []
    }

    for res in result:
        output["texts"].extend(res["rec_texts"])
        output["scores"].extend(res["rec_scores"])
        output["boxes"].extend(res["rec_boxes"].tolist())

    return output


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Image path is required"
        }))
        sys.exit(1)

    image_path = sys.argv[1]

    try:
        print("Loading English OCR...", file=sys.stderr)
        english_ocr = PaddleOCR(lang="en")

        print("Loading Hindi OCR...", file=sys.stderr)
        hindi_ocr = PaddleOCR(lang="hi")

        print("Running English OCR...", file=sys.stderr)
        english_result = run_ocr(
            english_ocr,
            image_path
        )

        print("Running Hindi OCR...", file=sys.stderr)
        hindi_result = run_ocr(
            hindi_ocr,
            image_path
        )

        output = {
            "success": True,

            # Keep the existing English OCR fields
            # so the current ReadRyt code does not break.
            "texts": english_result["texts"],
            "scores": english_result["scores"],
            "boxes": english_result["boxes"],

            # New Hindi OCR result
            "hindi": {
                "texts": hindi_result["texts"],
                "scores": hindi_result["scores"],
                "boxes": hindi_result["boxes"]
            }
        }

        print(json.dumps(
    output,
    ensure_ascii=True
))

    except Exception as error:
        print(json.dumps({
            "success": False,
            "error": str(error)
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()