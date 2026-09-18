import os
import json
import subprocess
import sys


RAW_FOLDER = r"E:\readryt\ReadRyt\training-data\raw"
OCR_SCRIPT = r"E:\readryt\ReadRyt\backend\ocr.py"
OUTPUT_FILE = r"E:\readryt\ReadRyt\training-data\ocr-results.json"


def main():
    if not os.path.exists(RAW_FOLDER):
        print(f"Folder not found: {RAW_FOLDER}")
        sys.exit(1)

    image_files = [
        file
        for file in os.listdir(RAW_FOLDER)
        if file.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
    ]

    image_files.sort()

    if not image_files:
        print("No images found.")
        sys.exit(1)

    results = []

    print(f"Found {len(image_files)} images.\n")

    for index, image_file in enumerate(image_files, start=1):
        image_path = os.path.join(RAW_FOLDER, image_file)

        print(
            f"[{index}/{len(image_files)}] Processing: {image_file}"
        )

        try:
            process = subprocess.run(
                [
                    sys.executable,
                    OCR_SCRIPT,
                    image_path,
                ],
                capture_output=True,
                text=True,
            )

            stdout = process.stdout.strip()
            stderr = process.stderr.strip()

            try:
                ocr_result = json.loads(stdout)

            except json.JSONDecodeError:
                ocr_result = {
                    "success": False,
                    "error": "Could not parse OCR output",
                    "raw_output": stdout,
                    "stderr": stderr,
                }

            results.append({
                "filename": image_file,
                "ocr": ocr_result,
            })

        except Exception as error:
            results.append({
                "filename": image_file,
                "ocr": {
                    "success": False,
                    "error": str(error),
                },
            })

    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            results,
            file,
            ensure_ascii=False,
            indent=2,
        )

    print("\nOCR processing completed.")
    print(f"Results saved to:")
    print(OUTPUT_FILE)


if __name__ == "__main__":
    main()