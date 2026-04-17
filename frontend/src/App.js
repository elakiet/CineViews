import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Predictor    from "./components/Predictor";
import Analytics    from "./components/Analytics";
import Recommender  from "./components/Recommender";
import Navbar       from "./components/Navbar";

function App() {
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