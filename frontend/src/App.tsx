import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Gate from "./pages/Gate";
import Public from "./pages/publicLanding";
import About from "./pages/About";
import AppPage from "./pages/AppPage";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Gate />} />
          <Route path="/public/ekam-xeffect" element={<Public />} />
          <Route path="/about" element={<About />} />
          <Route path="/app" element={<AppPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}