import { Routes, Route } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import Categories from "../pages/admin/Categories";
import Products from "../pages/admin/Products";
import Orders from "../pages/admin/Orders";
import Tables from "../pages/admin/Tables";
import Customers from "../pages/admin/Customers";
import Reviews from "../pages/admin/Reviews";
import Revenue from "../pages/admin/Revenue";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[1]} redirectTo="/staff">
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="categories" element={<Categories />} />
        <Route path="products" element={<Products />} />
        <Route path="orders" element={<Orders />} />
        <Route path="tables" element={<Tables />} />
        <Route path="customers" element={<Customers />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="revenue" element={<Revenue />} />
      </Route>
    </Routes>
  );
}
