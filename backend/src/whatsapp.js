const { Client, LocalAuth } = require("whatsapp-web.js");
const {
  downloadWhatsAppMedia,
} = require("./services/media.service");

const { runOCR } = require("./services/ocr.runner");

const {
  isPaymentScreenshot,
} = require("../payment-detector");

const {
  extractPaymentData,
} = require("./services/payment-extractor");

const {
  savePaymentRecord,
} = require("./services/payment.service");

const supabase = require("./config/supabase");

let client;
let isConnected = false;

const startWhatsApp = async (
  phoneNumber,
  userId,
  accessToken
) => {
  try {
    phoneNumber = phoneNumber.replace(/\D/g, "");

    return new Promise(async (resolve, reject) => {
      try {
        client = new Client({
          authStrategy: new LocalAuth({
            clientId: `readryt-${userId}`,
          }),

          pairWithPhoneNumber: {
            phoneNumber: phoneNumber,
            showNotification: true,
          },

          puppeteer: {
            headless: true,
          },
        });

        client.once("code", (code) => {
          console.log(
            `WhatsApp pairing code for user ${userId}:`,
            code
          );

          resolve(code);
        });

        client.on("ready", () => {
          console.log(
            `WhatsApp connected for user: ${userId}`
          );

          isConnected = true;
        });

        client.on("authenticated", () => {
          console.log(
            `WhatsApp authenticated for user: ${userId}`
          );
        });

        client.on("auth_failure", (message) => {
          console.error(
            `WhatsApp authentication failed for user ${userId}:`,
            message
          );

          isConnected = false;

          reject(
            new Error("WhatsApp authentication failed")
          );
        });

     client.on("disconnected", (reason) => {
  console.log(
    `WhatsApp disconnected for user ${userId}:`,
    reason
  );

  isConnected = false;
  client = null;
});

     client.on("message", async (message) => {
  console.log("New WhatsApp message received");

    let senderPhoneNumber = null;

  try {
    const contactMapping =
      await client.getContactLidAndPhone([
        message.from,
      ]);

    if (
      contactMapping &&
      contactMapping.length > 0
    ) {
      senderPhoneNumber =
        contactMapping[0].pn || null;
    }

    console.log(
      "Resolved sender phone:",
      senderPhoneNumber
    );

  } catch (error) {
    console.error(
      "Failed to resolve sender phone:",
      error
    );
  }
  console.log("From:", message.from);
  console.log("Message:", message.body);
  console.log("Has Media:", message.hasMedia);
  console.log("Timestamp:", message.timestamp);
  console.log("Message ID:", message.id);

  if (!message.hasMedia) {
    return;
  }

  let media = null;

  try {
    // 1. Download temporarily
    media = await downloadWhatsAppMedia(
      message,
      client
    );

    console.log("Temporary media downloaded:", media.filePath);

    // 2. Run local PaddleOCR
    console.log("Running PaddleOCR...");

    const ocrResult = await runOCR(
      media.filePath
    );

    console.log("OCR completed");

    // 3. Detect whether it is a payment screenshot
    const paymentResult =
      isPaymentScreenshot(ocrResult);

    console.log(
      "Payment detection result:",
      paymentResult
    );

    if (paymentResult.isPayment) {
     // 4. Extract payment information
const extractedPayment =
  extractPaymentData(ocrResult);

if (!extractedPayment.success) {
  throw new Error(
    extractedPayment.error ||
    "Payment extraction failed"
  );
}

console.log(
  "Extracted payment data:",
  extractedPayment.data
);

// 5. Find the user's business
const userSupabase = require("@supabase/supabase-js").createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  }
);

const {
  data: business,
  error: businessError,
} = await userSupabase
  .from("businesses")
  .select("id, business_name, business_type")
  .eq("user_id", userId)
  .single();

if (businessError) {
  throw businessError;
}

if (!business) {
  throw new Error(
    "No business found for this user"
  );
}

console.log(
  "Payment assigned to business:",
  business.business_name
);

// 6. Save payment
// 6. Save payment
const savedPayment =
  await savePaymentRecord({
    supabase: userSupabase,
    userId,
    businessId: business.id,
    message,
    senderPhoneNumber,
    paymentData: extractedPayment.data,
  });

console.log(
  "Payment saved successfully:",
  savedPayment.id
);

      // Payment extraction will be added later.
    } else {
      console.log(
        "NOT A PAYMENT SCREENSHOT"
      );
    }

  } catch (error) {
    console.error(
      "Media processing error:",
      error
    );

  } finally {
    // 4. Always delete temporary image
    if (media?.filePath) {
      try {
        const fs = require("fs");

        if (fs.existsSync(media.filePath)) {
          fs.unlinkSync(media.filePath);

          console.log(
            "Temporary image deleted:",
            media.filePath
          );
        }
      } catch (deleteError) {
        console.error(
          "Failed to delete temporary image:",
          deleteError
        );
      }
    }
  }
});

        await client.initialize();

      } catch (error) {
        reject(error);
      }
    });

  } catch (error) {
    console.error(
      "WhatsApp connection error:",
      error
    );

    throw error;
  }
};

module.exports = {
  startWhatsApp,
};