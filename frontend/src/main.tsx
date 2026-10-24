import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import GapsPage from "./pages/GapsPage";
import HomePage from "./pages/HomePage";
import InterviewPage from "./pages/InterviewPage";
import LearnPage from "./pages/LearnPage";
import VivaPage from "./pages/VivaPage";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <NavBar />
      <main className="min-h-[calc(100vh-64px)]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/viva" element={<VivaPage />} />
          <Route path="/interview" element={<InterviewPage />} />
          <Route path="/gaps" element={<GapsPage />} />
        </Routes>
      </main>
      <footer className="border-t border-primary/10 py-6 text-center text-sm text-ink/50">
        VivaBridge · runs on the open-weight Gemma 4 model via Ollama · sample questions only
      </footer>
    </BrowserRouter>
  </React.StrictMode>,
);
