import { Layout, Button, Space, Switch, ConfigProvider, theme } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LogoutOutlined } from "@ant-design/icons";
import StaffSidebar from "../components/StaffSidebar";
import api from "../services/api";

const { Sider, Header, Content } = Layout;

export default function StaffLayout() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );

  const toggleTheme = (checked) => {
    setDarkMode(checked);
    localStorage.setItem("darkMode", checked);
    window.dispatchEvent(new Event("darkModeChanged"));
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (err) {
      console.log(err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <Layout style={{ minHeight: "100vh" }}>
        <Sider width={230} theme="dark">
          <StaffSidebar />
        </Sider>

        <Layout style={{ background: darkMode ? "#0b1220" : "#f5f7fb" }}>
          <Header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: darkMode ? "#141414" : "#fff",
              borderBottom: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
            }}
          >
            <div style={{ color: darkMode ? "#e2e8f0" : "#0f172a", fontWeight: 700 }}>
              Trang nhân viên
            </div>
            <Space>
              <Switch
                checked={darkMode}
                onChange={toggleTheme}
                checkedChildren="Tối"
                unCheckedChildren="Sáng"
              />
              <Button icon={<LogoutOutlined />} onClick={handleLogout}>
                Đăng xuất
              </Button>
            </Space>
          </Header>

          <Content style={{ padding: 20 }}>
            <div
              style={{
                background: darkMode ? "#111827" : "#fff",
                borderRadius: 10,
                padding: 16,
                minHeight: "calc(100vh - 110px)",
              }}
            >
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
