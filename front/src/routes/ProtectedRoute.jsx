import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, loginPath = "/login" }) {
    const token = localStorage.getItem("token");

    // chưa login
    if (!token) {
        return <Navigate to={loginPath} replace />;
    }

    // đã login
    return children;
}
