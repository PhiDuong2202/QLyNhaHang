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
import Users from "../pages/admin/Users";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import AdminLogin from "../pages/admin/AdminLogin";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route
        element={
          <ProtectedRoute loginPath="/admin/login">
            <RoleRoute allowedRoles={[1]} redirectTo="/admin/login">
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
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  );
}
