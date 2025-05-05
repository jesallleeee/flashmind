import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Onboarding from "./components/onboarding";
import Generate from "./components/generate"; 
import Create from "./components/create"; 
import View from "./components/view";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/generate" element={<Generate />} />
        <Route path="/create" element={<Create />} />
        <Route path="/view" element={<View />} />
      </Routes>
    </Router>
  );
}

export default App;
