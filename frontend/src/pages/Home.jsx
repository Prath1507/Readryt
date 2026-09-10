import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Home() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [onboardingCompleted, setOnboardingCompleted] =
    useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      setUserId(session.user.id);

      // Get onboarding status
      const { data, error } = await supabase
        .from("users")
        .select("onboarding_completed")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Failed to get user status:", error);
      } else {
        setOnboardingCompleted(
          data.onboarding_completed === true
        );
      }

      setLoading(false);
    };

    checkUser();
  }, [navigate]);

  const handleStartOnboarding = () => {
    setMessage("");

    if (onboardingCompleted) {
      setMessage("Onboarding already completed.");
      return;
    }

    navigate("/onboarding");
  };

 const handleConnectWhatsApp = () => {
  if (!onboardingCompleted) {
    setMessage(
      "Please complete onboarding before connecting WhatsApp."
    );
    return;
  }

  navigate("/connect-whatsapp");
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>Welcome to ReadRyt</h1>

      <button onClick={handleStartOnboarding}>
        Start Onboarding
      </button>

      <br />
      <br />

      <button
        onClick={handleConnectWhatsApp}
        disabled={!onboardingCompleted}
      >
        Connect WhatsApp
      </button>

      <br />
      <br />

      <button onClick={handleLogout}>
        Logout
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}

export default Home;