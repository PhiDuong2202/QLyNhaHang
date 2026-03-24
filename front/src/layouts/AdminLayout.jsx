import { Layout, ConfigProvider, theme } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import api from "../services/api";

const { Sider, Header: AntHeader, Content, Footer } = Layout;

export default function AdminLayout() {
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const toggleTheme = (checked) => {
    setDarkMode(checked);
    localStorage.setItem("darkMode", checked);
    window.dispatchEvent(new Event("darkModeChanged"));
  };

  useEffect(() => {
    const pageBg = darkMode ? "#0b1220" : "#f5f7fb";
    document.body.style.background = pageBg;
    document.documentElement.style.background = pageBg;

    const root = document.getElementById("root");
    if (root) {
      root.style.background = pageBg;
      root.style.minHeight = "100vh";
    }
  }, [darkMode]);

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (err) {
      console.log(err);
    }

    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <Layout style={{ minHeight: "100vh" }}>
        <Sider width={230} theme="dark">
          <Sidebar />
        </Sider>

        <Layout
          style={{
            display: "flex",
            flexDirection: "column",
            background: darkMode ? "#0b1220" : "#f5f7fb",
            padding: 20,
            gap: 12,
          }}
        >
          <AntHeader
            style={{
              background: darkMode ? "#141414" : "#fff",
              padding: 0,
              borderBottom: darkMode ? "1px solid #333" : "1px solid #eee",
            }}
          >
            <Header
              onLogout={handleLogout}
              darkMode={darkMode}
              toggleTheme={toggleTheme}
            />
          </AntHeader>

          <Content
            style={{
              flex: 1,
              padding: 20,
              background: darkMode ? "#1f1f1f" : "#fff",
              borderRadius: 8,
              minHeight: 280,
              overflow: "auto",
            }}
          >
            <Outlet />
          </Content>

          <Footer
            style={{
              padding: "12px 20px",
              borderRadius: 8,
              textAlign: "center",
              background: darkMode ? "#111827" : "#f8fafc",
              color: darkMode ? "#cbd5e1" : "#475569",
              border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
            }}
          >
            © {new Date().getFullYear()} Quản Lý Nhà Hàng - Admin Panel
          </Footer>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
