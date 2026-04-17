import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Predictor    from "./components/Predictor";
import Analytics    from "./components/Analytics";
import Recommender  from "./components/Recommender";
import Navbar       from "./components/Navbar";

function App() {
  // Keep backend alive
const BACKEND = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";
setInterval(() => {
  fetch(`${BACKEND}/`).catch(() => {});
}, 840000); // ping every 14 minutes

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/"            element={<Predictor />} />
        <Route path="/recommend"   element={<Recommender />} />
        <Route path="/dashboard"   element={<Analytics />} />
      </Routes>
    </Router>
  );
}

export default App;