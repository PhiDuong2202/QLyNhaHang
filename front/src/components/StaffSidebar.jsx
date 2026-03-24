import { Menu } from "antd";
import {
  ShoppingCartOutlined,
  OrderedListOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

export default function StaffSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const items = [
    { key: "/staff", icon: <ShoppingCartOutlined />, label: "Đặt đơn" },
    { key: "/staff/orders", icon: <OrderedListOutlined />, label: "Đơn đang xử lý" },
  ];

  return (
    <div style={{ height: "100%", background: "#001529" }}>
      <div
        style={{
          height: 76,
          display: "flex",
          alignItems: "center",
          paddingLeft: 16,
          color: "white",
          fontSize: 20,
          fontWeight: "bold",
          borderBottom: "1px solid #1f1f1f",
          gap: 8,
        }}
      >
        <TeamOutlined />
        Nhân viên
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={(e) => navigate(e.key)}
        style={{ height: "100%" }}
      />
    </div>
  );
}
