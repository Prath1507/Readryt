const {
  extractPaymentData,
} = require("./src/services/payment-extractor");

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
    "…0462",
    "From: PRATHMESH C KAPSE (Saraswat Bank)",
    "Google Pay ..esh3@okicici",
    "Google transaction ID",
    "CICAgLi63KbjEA",
    "POWERED BY",
    "UPI",
  ],

  boxes: [
    [100, 100, 200, 150],
    [174, 207, 521, 325],
    [100, 350, 250, 400],
    [100, 450, 200, 500],
    [100, 550, 250, 600],
    [100, 650, 400, 700],
    [100, 750, 400, 800],
    [100, 850, 400, 900],
    [100, 950, 450, 1000],
    [100, 1050, 500, 1100],
    [100, 1150, 250, 1200],
    [100, 1250, 600, 1300],
    [100, 1350, 500, 1400],
    [100, 1450, 450, 1500],
    [100, 1550, 500, 1600],
    [100, 1650, 400, 1700],
    [100, 1750, 250, 1800],
  ],
};

const result = extractPaymentData(ocrResult);

console.log(
  JSON.stringify(result, null, 2)
);