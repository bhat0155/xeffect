import { Navigate, Route, Routes } from "react-router-dom";
import PublicLanding from "./pages/publicLanding";
import About from "./pages/About";
import AppPage from "./pages/AppPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLanding />} />
      <Route path="/public/:slug" element={<PublicLanding />} />
      <Route path="/about" element={<About />} />
      <Route path="/app" element={<AppPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}