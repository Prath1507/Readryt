function normalizeText(text) {
  return (text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function findText(texts, pattern) {
  return texts.find((text) =>
    pattern.test(normalizeText(text))
  );
}

function extractTransactionId(texts) {
  const index = texts.findIndex((text) =>
    /upi transaction id/i.test(text)
  );

  if (index !== -1 && texts[index + 1]) {
    const candidate = normalizeText(texts[index + 1]);

    if (/^[A-Za-z0-9]+$/.test(candidate)) {
      return candidate;
    }
  }

  return null;
}

function extractGoogleTransactionId(texts) {
  const index = texts.findIndex((text) =>
    /google transaction id/i.test(text)
  );

  if (index !== -1 && texts[index + 1]) {
    return normalizeText(texts[index + 1]);
  }

  return null;
}

function extractDateTime(texts) {
  const datePattern =
    /\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4},?\s+\d{1,2}:\d{2}\s*(am|pm)?\b/i;

  const value = findText(texts, datePattern);

  if (!value) {
    return {
      paymentDate: null,
      paymentTime: null,
    };
  }

  const match = normalizeText(value).match(
    /^(.+?),\s*(\d{1,2}:\d{2}\s*(?:am|pm)?)$/i
  );

  if (!match) {
    return {
      paymentDate: value,
      paymentTime: null,
    };
  }

  return {
    paymentDate: match[1],
    paymentTime: match[2],
  };
}

function extractName(texts) {
  const fromText = texts.find((text) =>
    /^From:/i.test(normalizeText(text))
  );

  if (!fromText) {
    return null;
  }

  let name = normalizeText(fromText)
    .replace(/^From:\s*/i, "");

  name = name.replace(/\s*\([^)]*\)\s*$/, "");

  return name || null;
}

function extractPayee(texts) {
  const toText = texts.find((text) =>
    /^To:/i.test(normalizeText(text))
  );

  if (!toText) {
    return null;
  }

  return normalizeText(toText)
    .replace(/^To:\s*/i, "")
    .trim();
}

function extractBank(texts) {
  const bankText = texts.find((text) =>
    /bank/i.test(normalizeText(text))
  );

  if (!bankText) {
    return null;
  }

  return normalizeText(bankText);
}

function extractPaymentReferences(
  texts,
  {
    transactionId = null,
    googleTransactionId = null,
    paymentDate = null,
    paymentTime = null,
    amountText = null,
  } = {}
) {
  const references = [];

  const normalizedTransactionId =
    normalizeText(transactionId);

  const normalizedGoogleTransactionId =
    normalizeText(googleTransactionId);

  const normalizedAmount =
    normalizeText(amountText)
      .replace(/^₹/, "")
      .replace(/,/g, "");

  for (const text of texts) {
    const value = normalizeText(text);

    if (!value) {
      continue;
    }

    // Known structured fields
    if (
      normalizedTransactionId &&
      value === normalizedTransactionId
    ) {
      continue;
    }

    if (
      normalizedGoogleTransactionId &&
      value === normalizedGoogleTransactionId
    ) {
      continue;
    }

    // Sender / receiver structured fields
    if (/^from:/i.test(value)) {
      continue;
    }

    if (/^to:/i.test(value)) {
      continue;
    }

    // Transaction labels
    if (/upi transaction id/i.test(value)) {
      continue;
    }

    if (/google transaction id/i.test(value)) {
      continue;
    }

    if (/transaction id/i.test(value)) {
      continue;
    }

    if (/utr\s*:/i.test(value)) {
      continue;
    }

    // Payment/application labels
    if (/powered by/i.test(value)) {
      continue;
    }

    if (/^upi$/i.test(value)) {
      continue;
    }

    if (/completed/i.test(value)) {
      continue;
    }

    if (/google pay/i.test(value)) {
      continue;
    }

    if (/phonepe/i.test(value)) {
      continue;
    }

    if (/paytm/i.test(value)) {
      continue;
    }

    if (/bank/i.test(value)) {
      continue;
    }

    if (/pay again/i.test(value)) {
      continue;
    }

    // Date/time
    if (
      /\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}/i.test(
        value
      )
    ) {
      continue;
    }

    if (
      /\b\d{1,2}:\d{2}\s*(am|pm)\b/i.test(
        value
      )
    ) {
      continue;
    }

    // Pure amount / OCR amount noise
    const amountCandidate = value
      .replace(/^₹/, "")
      .replace(/^र/, "")
      .replace(/[०-९]/g, (digit) => {
        const digits = {
          "०": "0",
          "१": "1",
          "२": "2",
          "३": "3",
          "४": "4",
          "५": "5",
          "६": "6",
          "७": "7",
          "८": "8",
          "९": "9",
        };

        return digits[digit];
      })
      .replace(/,/g, "");

    if (
      /^\d+(?:\.\d{1,2})?$/.test(
        amountCandidate
      )
    ) {
      continue;
    }

    if (
      normalizedAmount &&
      amountCandidate === normalizedAmount
    ) {
      continue;
    }

    // Very short OCR noise
    if (value.length < 3) {
      continue;
    }

    references.push(value);
  }

  return [...new Set(references)];
}

function extractAmount(ocrResult) {
  const hindiTexts = ocrResult.hindi?.texts || [];
  const hindiBoxes = ocrResult.hindi?.boxes || [];

  const candidates = [];

  // Devanagari digits → normal digits
  const devanagariDigits = {
    "०": "0",
    "१": "1",
    "२": "2",
    "३": "3",
    "४": "4",
    "५": "5",
    "६": "6",
    "७": "7",
    "८": "8",
    "९": "9",
  };

  function normalizeAmountText(text) {
    let value = normalizeText(text)
      .replace(/\s+/g, "");

    // Convert Devanagari digits to normal digits
    value = value.replace(
      /[०-९]/g,
      (digit) => devanagariDigits[digit]
    );

    // Hindi OCR sometimes reads ₹ as "र".
    // In the amount context, treat leading "र" as ₹.
    if (/^र\d[\d,]*(?:\.\d{1,2})?$/.test(value)) {
      value = "₹" + value.slice(1);
    }

    return value;
  }

  for (let i = 0; i < hindiTexts.length; i++) {
    const text = normalizeAmountText(hindiTexts[i]);

    if (!text || !hindiBoxes[i]) {
      continue;
    }

    // We only accept values that contain the rupee marker.
    if (!/^₹\d[\d,]*(?:\.\d{1,2})?$/.test(text)) {
      continue;
    }

    const [x1, y1, x2, y2] = hindiBoxes[i];

    const width = x2 - x1;
    const height = y2 - y1;
    const area = width * height;

    candidates.push({
      amountText: text,
      box: [x1, y1, x2, y2],
      y1,
      area,
      score: ocrResult.hindi.scores?.[i] || 0,
    });
  }

  if (candidates.length === 0) {
    console.log("No Hindi OCR amount found.");
    return null;
  }

  candidates.sort((a, b) => {
    const scoreA =
      a.area -
      a.y1 * 2 +
      a.score * 100;

    const scoreB =
      b.area -
      b.y1 * 2 +
      b.score * 100;

    return scoreB - scoreA;
  });

  console.log(
    "Selected Hindi amount candidate:",
    candidates[0]
  );


  return candidates[0].amountText;
}

function extractMessageContext(messageText) {
  const text = normalizeText(messageText);

  if (!text) {
    return {
      purpose: null,
      references: [],
    };
  }

  const words = text.split(/\s+/);

  const purposeKeywords = [
    "maintenance",
    "rent",
    "booking",
    "travel",
    "fee",
    "fees",
    "order",
    "product",
    "service",
  ];

  let purpose = null;
  const references = [];

  for (const word of words) {
    const cleanWord = word
      .replace(/[.,!?;:()[\]{}]/g, "")
      .trim();

    if (!cleanWord) {
      continue;
    }

    const lowerWord = cleanWord.toLowerCase();

    if (purposeKeywords.includes(lowerWord)) {
      purpose = cleanWord;
      continue;
    }

    references.push(cleanWord);
  }

  return {
    purpose,
    references,
  };
}



function extractPaymentData(ocrResult, messageText) {
  if (!ocrResult || !ocrResult.success) {
    return {
      success: false,
      error: "Invalid OCR result",
    };
  }

  const texts = ocrResult.texts || [];

  const whatsappMessage =
  normalizeText(messageText);

console.log(
  "WhatsApp message context:",
  whatsappMessage
);

const messageContext =
  extractMessageContext(whatsappMessage);

console.log(
  "Message context extracted:",
  messageContext
);

  const {
    paymentDate,
    paymentTime,
  } = extractDateTime(texts);

  const amountText =
  extractAmount(ocrResult);

  return {
    success: true,

   data: {
  name: extractName(texts),

 amount_text: amountText,

  paymentDate,
  paymentTime,

  paymentPurpose:
    messageContext.purpose,

  messageReferences:
    messageContext.references,

  paymentReferences:
    extractPaymentReferences(texts, {
      transactionId:
        extractTransactionId(texts),

      googleTransactionId:
        extractGoogleTransactionId(texts),

      paymentDate,
      paymentTime,

     amountText,
  }),

  transactionId:
    extractTransactionId(texts),

  googleTransactionId:
    extractGoogleTransactionId(texts),

  utr: null,

  payee:
    extractPayee(texts),

  bank:
    extractBank(texts),

  status: "unverified",
},
  };
}

module.exports = {
  extractPaymentData,
};