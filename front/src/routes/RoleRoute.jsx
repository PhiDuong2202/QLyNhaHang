import { Navigate } from "react-router-dom";

export default function RoleRoute({
  children,
  allowedRoles = [],
  redirectTo = "/login",
}) {
  const user = JSON.parse(localStorage.getItem("user"));
  const roleId = Number(user?.role_id);
  const isAllowed =
    allowedRoles.length === 0 || allowedRoles.includes(roleId);

  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
