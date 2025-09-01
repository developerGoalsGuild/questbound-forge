import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ConfirmEmail from "./pages/ConfirmEmail";
// Import other pages/components as needed

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Other routes */}
        <Route path="/confirm-email" element={<ConfirmEmail />} />
      </Routes>
    </Router>
  );
};

export default App;
