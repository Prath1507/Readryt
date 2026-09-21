const { spawn } = require("child_process");
const path = require("path");

const runOCR = (imagePath) => {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(
      __dirname,
      "../../../ocr-env/Scripts/python.exe"
    );

    const scriptPath = path.join(
      __dirname,
      "../../ocr.py"
    );

    const python = spawn(
      pythonPath,
      [scriptPath, imagePath],
      {
        windowsHide: true,
      }
    );

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    python.on("error", (error) => {
      reject(error);
    });

    python.on("close", (code) => {
     if (code !== 0) {
  console.error("OCR stdout:", stdout);
  console.error("OCR stderr:", stderr);

  return reject(
    new Error(`OCR process exited with code ${code}`)
  );
}

      try {
        const result = JSON.parse(stdout.trim());

        resolve(result);
      } catch (error) {
        console.error("OCR output:", stdout);
        console.error("OCR stderr:", stderr);

        reject(
          new Error("Failed to parse OCR result")
        );
      }
    });
  });
};

module.exports = {
  runOCR,
};