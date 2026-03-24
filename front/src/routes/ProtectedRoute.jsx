import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
    const token = localStorage.getItem("token");

    // chưa login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // đã login
    return children;
}
