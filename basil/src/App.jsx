import React, { useState } from "react";
import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Dashboard />
      {/* <p className="text-red-900">hELO</p> */}
    </>
  );
}

export default App;
