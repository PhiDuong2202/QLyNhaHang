import { Menu } from "antd";
import {
    DashboardOutlined,
    AppstoreOutlined,
    ShoppingOutlined,
    OrderedListOutlined,
    TableOutlined,
    UserOutlined,
    StarOutlined,
    SafetyCertificateOutlined,
    DollarCircleOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const items = [
        { key: "/admin", icon: <DashboardOutlined />, label: "Dashboard" },
        { key: "/admin/categories", icon: <AppstoreOutlined />, label: "Danh mục" },
        { key: "/admin/products", icon: <ShoppingOutlined />, label: "Món ăn" },
        { key: "/admin/orders", icon: <OrderedListOutlined />, label: "Đơn hàng" },
        { key: "/admin/tables", icon: <TableOutlined />, label: "Bàn ăn" },
        { key: "/admin/customers", icon: <UserOutlined />, label: "Khách hàng" },
        { key: "/admin/reviews", icon: <StarOutlined />, label: "Đánh giá" },
        { key: "/admin/revenue", icon: <DollarCircleOutlined />, label: "Doanh thu" },
        { key: "/admin/users", icon: <TeamOutlined />, label: "Tài khoản" },
    ];

    return (
        <div style={{ height: "100%", background: "#001529" }}>
            <div
                style={{
                    height: 80,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 16,
                    color: "white",
                    fontSize: 22,
                    fontWeight: "bold",
                    borderBottom: "1px solid #1f1f1f",
                }}
            >
                <SafetyCertificateOutlined style={{ fontSize: 26, marginRight: 10 }} />
                Admin Panel
            </div>

            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[location.pathname]}
                items={items}
                onClick={(e) => navigate(e.key)}
                style={{
                    height: "100%",
                    borderRight: 0,
                }}
                className="hover-menu"
            />

            <style>
{`
  .hover-menu .ant-menu-item {
    transition: 0.2s;
    border-radius: 8px;
    margin: 4px 8px;
    border: 1px solid transparent;
  }

  .hover-menu .ant-menu-item:hover {
    background: transparent !important;
    border: 1px solid #2563eb;
    transform: translateX(3px);
  }

  .hover-menu .ant-menu-item-selected {
    background: transparent !important;
    border: 1px solid #1d4ed8 !important;
    color: #1d4ed8 !important;
  }

  .hover-menu .ant-menu-item:active {
    background: transparent !important;
  }

  .hover-menu.ant-menu-dark .ant-menu-item-selected {
    background: transparent !important;
    border: 1px solid #fff !important;
    color: #fff !important;
  }
`}
</style>
        </div>
    );
}
