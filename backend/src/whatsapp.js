const { Client, LocalAuth } = require("whatsapp-web.js");

let client;
let isConnected = false;

const startWhatsApp = async (phoneNumber, userId) => {
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

        client.on("disconnected", async (reason) => {
          console.log(
            `WhatsApp disconnected for user ${userId}:`,
            reason
          );

          isConnected = false;

          try {
            await client.destroy();

            console.log(
              `WhatsApp client cleaned up for user ${userId}`
            );
          } catch (error) {
            console.error(
              "WhatsApp cleanup error:",
              error
            );
          }

          client = null;
        });

        client.on("message", async (message) => {
          console.log("New WhatsApp message received");
          console.log("From:", message.from);
          console.log("Message:", message.body);
          console.log("Has Media:", message.hasMedia);
          console.log("Timestamp:", message.timestamp);
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