import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminRoutes from "./routes/AdminRoutes";
import StaffRoutes from "./routes/StaffRoutes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/staff/*" element={<StaffRoutes />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
