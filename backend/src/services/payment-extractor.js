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

function extractPaymentReferences(texts) {
  const references = [];

  for (const text of texts) {
    const value = normalizeText(text);

    if (!value) {
      continue;
    }

    if (/^from:/i.test(value)) {
      continue;
    }

    if (/^to:/i.test(value)) {
      continue;
    }

    if (/upi transaction id/i.test(value)) {
      continue;
    }

    if (/google transaction id/i.test(value)) {
      continue;
    }

    if (/transaction id/i.test(value)) {
      continue;
    }

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

    if (value.length < 3) {
      continue;
    }

    references.push(value);
  }

  return [...new Set(references)];
}

function extractAmount(ocrResult) {
  const texts = ocrResult.texts || [];
  const boxes = ocrResult.boxes || [];

  const candidates = [];

  for (let i = 0; i < texts.length; i++) {
    const text = normalizeText(texts[i]);

    if (!text || !boxes[i]) {
      continue;
    }

    const cleaned = text
      .replace(/,/g, "")
      .replace(/\s/g, "");

    if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) {
      continue;
    }

    const amount = Number(cleaned);

    if (!Number.isFinite(amount)) {
      continue;
    }

    // Ignore very large numbers such as transaction IDs.
    if (amount > 1000000) {
      continue;
    }

    const [x1, y1, x2, y2] = boxes[i];

    const width = x2 - x1;
    const height = y2 - y1;
    const area = width * height;

    candidates.push({
      amount,
      text,
      y1,
      area,
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  /*
   * Payment amount is normally one of the
   * largest numeric texts near the top.
   */

  candidates.sort((a, b) => {
    const scoreA =
      a.area -
      a.y1 * 2;

    const scoreB =
      b.area -
      b.y1 * 2;

    return scoreB - scoreA;
  });

  return candidates[0].amount;
}

function extractPaymentData(ocrResult) {
  if (!ocrResult || !ocrResult.success) {
    return {
      success: false,
      error: "Invalid OCR result",
    };
  }

  const texts = ocrResult.texts || [];

  const {
    paymentDate,
    paymentTime,
  } = extractDateTime(texts);

  return {
    success: true,

    data: {
      name: extractName(texts),

      amount: extractAmount(ocrResult),

      paymentDate,
      paymentTime,

      paymentReferences:
        extractPaymentReferences(texts),

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