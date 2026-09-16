const fs = require("fs");
const path = require("path");

const downloadWhatsAppMedia = async (message, client) => {
  if (!message.hasMedia) {
    return null;
  }

  console.log("Starting media download...");

  const messageId = message.id.$1;

  if (!messageId) {
    throw new Error("WhatsApp message ID not found");
  }

  const result = await client.pupPage.evaluate(async (msgId) => {
    try {
      const collections =
        window.require("WAWebCollections");

      const msg =
        collections.Msg.get(msgId) ||
        (
          await collections.Msg.getMessagesById([msgId])
        )?.messages?.[0];

      if (!msg) {
        throw new Error("WhatsApp message not found");
      }

      if (msg.mediaData?.mediaStage !== "RESOLVED") {
        await msg.downloadMedia({
          downloadEvenIfExpensive: true,
          rmrReason: 1,
        });
      }

      if (
        msg.mediaData?.mediaStage?.includes("ERROR") ||
        msg.mediaData?.mediaStage === "FETCHING"
      ) {
        throw new Error(
          `Media could not be resolved: ${msg.mediaData?.mediaStage}`
        );
      }

      const mockQpl = {
        addAnnotations: function () {
          return this;
        },

        addPoint: function () {
          return this;
        },
      };

      const decryptedMedia =
        await window
          .require("WAWebDownloadManager")
          .downloadManager
          .downloadAndMaybeDecrypt({
            directPath: msg.directPath,
            encFilehash: msg.encFilehash,
            filehash: msg.filehash,
            mediaKey: msg.mediaKey,
            mediaKeyTimestamp: msg.mediaKeyTimestamp,
            type: msg.type,
            signal: new AbortController().signal,
            downloadQpl: mockQpl,
          });

      const data =
        await window.WWebJS.arrayBufferToBase64Async(
          decryptedMedia
        );

      return {
        success: true,
        data,
        mimetype: msg.mimetype,
        filename: msg.filename,
        filesize: msg.size,
      };

    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }, messageId);

  if (!result.success) {
    throw new Error(
      result.error || "Failed to download WhatsApp media"
    );
  }

  const uploadsDir = path.join(
    __dirname,
    "../../uploads"
  );

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, {
      recursive: true,
    });
  }

  const extension =
    result.mimetype.split("/")[1] || "bin";

  const fileName =
    `${Date.now()}-${message.id.id}.${extension}`;

  const filePath = path.join(
    uploadsDir,
    fileName
  );

  fs.writeFileSync(
    filePath,
    Buffer.from(result.data, "base64")
  );

  console.log("Media downloaded:", filePath);

  return {
    fileName,
    filePath,
    mimetype: result.mimetype,
    filesize: result.filesize,
  };
};

module.exports = {
  downloadWhatsAppMedia,
};