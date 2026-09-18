import sys
import json
from paddleocr import PaddleOCR


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Image path is required"
        }))
        sys.exit(1)

    image_path = sys.argv[1]

    try:
        ocr = PaddleOCR(lang="en")

        result = ocr.predict(image_path)

        output = {
            "success": True,
            "texts": [],
            "scores": [],
            "boxes": []
        }

        for res in result:
            output["texts"] = res["rec_texts"]
            output["scores"] = res["rec_scores"]
            output["boxes"] = res["rec_boxes"].tolist()

        print(json.dumps(output))

    except Exception as error:
        print(json.dumps({
            "success": False,
            "error": str(error)
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()