import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import EmployeePortal from "./pages/EmployeePortal";
import HRDashboard from "./pages/HRDashboard";
import Login from "./pages/Login";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/employee/login" />} />
        <Route path="/employee/login" element={<Login type="employee" />} />
        <Route path="/hr/login" element={<Login type="hr" />} />
        <Route path="/employee/portal" element={<EmployeePortal />} />
        <Route path="/hr/dashboard" element={<HRDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
