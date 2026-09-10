import { BrowserRouter, Routes, Route } from "react-router-dom";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import ConnectWhatsApp from "./pages/ConnectWhatsApp";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route
  path="/connect-whatsapp"
  element={<ConnectWhatsApp />}
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;