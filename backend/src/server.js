require("dotenv").config();


const express = require("express");
const cors = require("cors");

const supabase = require("./config/supabase");
const { startWhatsApp } = require("./whatsapp");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "ReadRyt backend is running",
  });
});

app.post("/api/whatsapp/connect", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization token is required",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Identify the logged-in Supabase user
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        message: "Invalid or expired login",
      });
    }

    const userId = data.user.id;
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        message: "Phone number is required",
      });
    }

    console.log(
      "Starting WhatsApp connection for user:",
      userId
    );

   const pairingCode = await startWhatsApp(
  phoneNumber,
  userId,
  token
);

    return res.json({
      message: "Pairing code generated",
      pairingCode,
    });

  } catch (error) {
    console.error("WhatsApp connect error:", error);

    return res.status(500).json({
      message: "Failed to generate pairing code",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`ReadRyt backend running on port ${PORT}`);
});