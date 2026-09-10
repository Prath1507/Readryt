import { useState } from "react";
import { supabase } from "../lib/supabase";

function ConnectWhatsApp() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

const handleConnect = async (e) => {
  e.preventDefault();

  try {
    setLoading(true);
    setMessage("");
    setPairingCode("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setMessage("Please login again.");
      return;
    }

    const response = await fetch(
      "http://localhost:5000/api/whatsapp/connect",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          phoneNumber,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setMessage(
        data.message || "Failed to generate pairing code"
      );
      return;
    }

    setPairingCode(data.pairingCode);

  } catch (error) {
    console.error(error);
    setMessage("Unable to connect to the backend");
  } finally {
    setLoading(false);
  }
};

  return (
    <div>
      <h1>Connect WhatsApp</h1>

      <p>
        Enter your WhatsApp number with country code.
      </p>

      <form onSubmit={handleConnect}>
        <input
          type="text"
          placeholder="919876543210"
          value={phoneNumber}
          onChange={(e) =>
            setPhoneNumber(e.target.value)
          }
          required
        />

        <button type="submit" disabled={loading}>
          {loading
            ? "Generating..."
            : "Generate Connection Code"}
        </button>
      </form>

      {pairingCode && (
        <div>
          <h2>Your WhatsApp Connection Code</h2>

          <h1>{pairingCode}</h1>

          <p>
            Open WhatsApp → Settings → Linked Devices →
            Link with phone number instead.
          </p>
        </div>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}

export default ConnectWhatsApp;