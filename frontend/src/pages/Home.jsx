import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Home() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState("");

  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      // Get user's businesses
      const {
        data: businessData,
        error: businessError,
      } = await supabase
        .from("businesses")
        .select("id, business_name, business_type")
        .eq("user_id", session.user.id)
        .order("created_at", {
          ascending: true,
        });

      if (businessError) {
        console.error(
          "Failed to get businesses:",
          businessError
        );

        setMessage("Failed to load business.");
        setLoading(false);
        return;
      }

      const userBusinesses = businessData || [];

      setBusinesses(userBusinesses);

      if (userBusinesses.length === 0) {
        setMessage("No business found.");
        setLoading(false);
        return;
      }

      const businessId = userBusinesses[0].id;

      setSelectedBusiness(businessId);

      // Get payment records
      const {
        data: paymentData,
        error: paymentError,
      } = await supabase
        .from("payment_records")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", {
          ascending: false,
        });

      if (paymentError) {
        console.error(
          "Failed to get payment records:",
          paymentError
        );

        setMessage(
          "Failed to load payment records."
        );

        setLoading(false);
        return;
      }

      setPayments(paymentData || []);

      setLoading(false);
    };

    loadDashboard();
  }, [navigate]);

  const handleBusinessChange = async (businessId) => {
    setSelectedBusiness(businessId);
    setMessage("");

    const {
      data,
      error,
    } = await supabase
      .from("payment_records")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Failed to load payments:",
        error
      );

      setMessage(
        "Failed to load payment records."
      );

      return;
    }

    setPayments(data || []);
  };

  const handleConnectWhatsApp = () => {
    navigate("/connect-whatsapp");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div>
      <h1>ReadRyt Dashboard</h1>

      {businesses.length > 0 && (
        <div>
          <label>
            Business
          </label>

          <br />

          <select
            value={selectedBusiness}
            onChange={(e) =>
              handleBusinessChange(e.target.value)
            }
          >
            {businesses.map((business) => (
              <option
                key={business.id}
                value={business.id}
              >
                {business.business_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <br />

      <button onClick={handleConnectWhatsApp}>
        Connect WhatsApp
      </button>

      <button onClick={handleLogout}>
        Logout
      </button>

      <br />
      <br />

      <h2>Payment Records</h2>

      {payments.length === 0 ? (
        <p>No payment records found.</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Amount</th>
              <th>References</th>
              <th>Transaction ID</th>
              <th>UTR</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>
                  {payment.payment_date || "-"}
                </td>

                <td>
                  {payment.name || "-"}
                </td>

                <td>
                  {payment.whatsapp_sender || "-"}
                </td>

                <td>
                  {payment.amount !== null
                    ? payment.amount
                    : "-"}
                </td>

                <td>
                  {Array.isArray(
                    payment.payment_references
                  )
                    ? payment.payment_references.join(
                        ", "
                      )
                    : "-"}
                </td>

                <td>
                  {payment.transaction_id || "-"}
                </td>

                <td>
                  {payment.utr || "-"}
                </td>

                <td>
                  {payment.status || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}

export default Home;