const { createWorker } = require("tesseract.js");

const extractTextFromImage = async (filePath, options = {}) => {
  console.log("Starting OCR...");

  const worker = await createWorker("eng");

  try {
    if (options.whitelist) {
      await worker.setParameters({
        tessedit_char_whitelist: options.whitelist,
      });
    }

    const {
      data: { text },
    } = await worker.recognize(filePath);

    console.log("OCR completed");

    return text;
  } finally {
    await worker.terminate();
  }
};

module.exports = {
  extractTextFromImage,
};