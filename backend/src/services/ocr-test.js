const sharp = require("sharp");
const { extractTextFromImage } = require("./ocr.service");

const input =
  "./uploads/1789563689927-AC3CC63E9C62A663213514DF449E09C5.jpeg";

const output =
  "./uploads/amount-test.jpeg";

async function test() {
  console.log("Preparing amount region...");

  await sharp(input)
    .extract({
      left: 100,
      top: 300,
      width: 520,
      height: 300,
    })
    .resize({
      width: 2080,
    })
    .grayscale()
    .normalize()
    .sharpen()
    .jpeg({
      quality: 100,
    })
    .toFile(output);

  console.log("Amount crop created.");

  const text = await extractTextFromImage(
    output,
    {
      whitelist: "0123456789.,₹",
    }
  );

  console.log("\n--- NUMERIC OCR ---\n");
  console.log(text);
}

test().catch((error) => {
  console.error("OCR test failed:", error);
});