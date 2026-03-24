import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import StaffLayout from "../layouts/StaffLayout";
import OrderDesk from "../pages/staff/OrderDesk";
import StaffOrders from "../pages/staff/StaffOrders";

export default function StaffRoutes() {
  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[2]} redirectTo="/admin">
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
