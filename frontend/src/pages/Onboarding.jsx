import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Onboarding() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();

  setLoading(true);
  setMessage("");

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    navigate("/login");
    return;
  }

  // Create the business
  const { error: businessError } = await supabase
    .from("businesses")
    .insert({
      user_id: session.user.id,
      business_name: businessName,
      business_type: businessType,
    });

  if (businessError) {
    setMessage(businessError.message);
    setLoading(false);
    return;
  }

  // Mark onboarding as completed
  const { error: userError } = await supabase
    .from("users")
    .update({
      onboarding_completed: true,
    })
    .eq("id", session.user.id);

  if (userError) {
    setMessage(userError.message);
    setLoading(false);
    return;
  }

  navigate("/");
};

  return (
    <div>
      <h1>Set Up ReadRyt</h1>

      <p>Tell us a little about your business.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Your Name</label>
          <br />

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <label>Business Name</label>
          <br />

          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <label>Type of Business</label>
          <br />

          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            required
          >
            <option value="">Select type</option>

            <option value="Maintenance / Property">
              Maintenance / Property
            </option>

            <option value="Travel / Bookings">
              Travel / Bookings
            </option>

            <option value="Products / Orders">
              Products / Orders
            </option>

            <option value="Fees / Services">
              Fees / Services
            </option>

            <option value="General Payments">
              General Payments
            </option>

            <option value="Other">
              Other
            </option>
          </select>
        </div>

        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Complete Onboarding"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default Onboarding;