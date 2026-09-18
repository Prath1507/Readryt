const {
  isPaymentScreenshot,
} = require("./payment-detector");

const ocrResult = {
  success: true,

  texts: [
    "To tansa 1&2",
    "2,200",
    "tansa1&2",
    "Pay again",
    "Completed",
    "10 Sept 2026, 9:42 am",
    "Saraswat Bank 3638",
    "UPI transaction ID",
    "625393217019",
    "To: OM SHIVALIK NAGAR CO OP SHG",
    "From: PRATHMESH C KAPSE (Saraswat Bank)",
    "Google Pay ..esh3@okicici",
    "Google transaction ID",
    "CICAgLi63KbjEA",
    "POWERED BY",
    "UPI",
  ],
};

const result = isPaymentScreenshot(ocrResult);

console.log(result);