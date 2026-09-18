const PAYMENT_KEYWORDS = [
  "upi",
  "upi transaction",
  "transaction id",
  "google transaction id",
  "payment",
  "paid",
  "completed",
  "from:",
  "to:",
  "bank",
  "phonepe",
  "google pay",
  "gpay",
  "paytm",
];

function isPaymentScreenshot(ocrResult) {
  if (!ocrResult || !ocrResult.success) {
    return {
      isPayment: false,
      score: 0,
      matchedKeywords: [],
    };
  }

  const texts = ocrResult.texts || [];

  const combinedText = texts
    .join(" ")
    .toLowerCase();

  const matchedKeywords = PAYMENT_KEYWORDS.filter(
    (keyword) => combinedText.includes(keyword)
  );

  const score = matchedKeywords.length;

  return {
    isPayment: score >= 2,
    score,
    matchedKeywords,
  };
}

module.exports = {
  isPaymentScreenshot,
};