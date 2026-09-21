from paddleocr import PaddleOCR


images = [
    r"C:\Users\info\Downloads\90.jpeg",
    r"C:\Users\info\Downloads\400.jpeg",
]


print("Loading English OCR...")
english_ocr = PaddleOCR(lang="en")

print("Loading Hindi OCR...")
hindi_ocr = PaddleOCR(lang="hi")


for image_path in images:
    print("\n========================================")
    print("IMAGE:", image_path)
    print("========================================")

    print("\n--- ENGLISH OCR ---")

    english_result = english_ocr.predict(image_path)

    for result in english_result:
        print(result["rec_texts"])

    print("\n--- HINDI OCR ---")

    hindi_result = hindi_ocr.predict(image_path)

    for result in hindi_result:
        print(result["rec_texts"])