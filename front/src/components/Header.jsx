import { Avatar, Dropdown, Space, Switch } from "antd";
import {
    UserOutlined,
    LogoutOutlined,
    BulbOutlined,
} from "@ant-design/icons";

export default function Header({ onLogout, darkMode, toggleTheme }) {
    const items = [
        {
            key: "1",
            label: "Đăng xuất",
            icon: <LogoutOutlined />,
            onClick: onLogout,
        },
    ];

    return (
        <div
            style={{
                height: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 20px",
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            <div style={{ display: "flex", paddingTop: 10, marginLeft: -10 }}>
                <h2 style={{ margin: 20 }}>Quản lý nhà hàng</h2>
                <span style={{ marginLeft: -40, marginTop: 45, fontSize: 12, color: "#888" }}>
                    Hệ thống quản trị Admin
                </span>
            </div>

            <Space size="large">
                <Space>
                    <BulbOutlined />
                    <Switch
                        checked={darkMode}
                        onChange={toggleTheme}
                        checkedChildren="Tối"
                        unCheckedChildren="Sáng"
                    />
                </Space>

                <Dropdown menu={{ items }} placement="bottomRight">
                    <Space style={{ cursor: "pointer" }}>
                        <Avatar size={40} icon={<UserOutlined />} />
                        <div style={{ lineHeight: "14px" }}>
                            <div style={{ fontWeight: 600 }}>Admin</div>
                            <div style={{ fontSize: 12, color: "#888" }}>
                                Quản trị viên
                            </div>
                        </div>
                    </Space>
                </Dropdown>
            </Space>
        </div>
    );
}
