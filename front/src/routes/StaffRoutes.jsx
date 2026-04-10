import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import StaffLayout from "../layouts/StaffLayout";
import OrderDesk from "../pages/staff/OrderDesk";
import StaffOrders from "../pages/staff/StaffOrders";
import StaffLogin from "../pages/staff/StaffLogin";

export default function StaffRoutes() {
  return (
    <Routes>
      <Route path="login" element={<StaffLogin />} />
      <Route
        element={
          <ProtectedRoute loginPath="/staff/login">
            <RoleRoute allowedRoles={[2]} redirectTo="/staff/login">
              <StaffLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<OrderDesk />} />
        <Route path="orders" element={<StaffOrders />} />
      </Route>
    </Routes>
  );
}
