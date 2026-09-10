import { useState } from "react";
import { supabase } from "../lib/supabase";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: userError } = await supabase
        .from("users")
        .insert({
          id: data.user.id,
          email: data.user.email,
        });

      if (userError) {
        setMessage(userError.message);
        setLoading(false);
        return;
      }
    }

    setMessage("Account created successfully!");

    setLoading(false);
  };

  return (
    <div>
      <h1>Create your ReadRyt account</h1>

      <form onSubmit={handleSignup}>
        <div>
          <label>Email</label>
          <br />

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <label>Password</label>
          <br />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default Signup;