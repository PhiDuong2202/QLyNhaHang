import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Input, Button, Typography, Alert } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import api from "../../services/api";

const { Title } = Typography;

export default function StaffLogin() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (token && user?.role_id === 2) {
             navigate("/staff");
        }
    }, [navigate]);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!form.email || !form.password) {
            setError("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const res = await api.post("/login", {
                email: form.email.trim(),
                password: form.password.trim(),
            });

            const token = res?.data?.token;
            const user = res?.data?.user;

            if (!token || !user) {
                setError("Dữ liệu trả về không hợp lệ");
                return;
            }

            if (user.role_id === 2) {
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));
                localStorage.setItem("role", user.role_id);
    
                api.prefetchStaffData?.().catch(() => {});
                navigate("/staff");
            } else {
                setError("Tài khoản không phải là Nhân viên!");
            }
        } catch (err) {
            console.log(err);
            setError("Sai email hoặc mật khẩu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "linear-gradient(135deg, #fbbf24, #ea580c)",
            }}
        >
            <Card
                style={{
                    width: 380,
                    borderRadius: 16,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                    border: "none",
                }}
            >
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <Title level={3} style={{ color: "#ea580c", fontWeight: 800 }}>Dành Cho Nhân Viên</Title>
                    <span style={{ color: "#64748b" }}>Đăng nhập để vào hệ thống</span>
                </div>

                {error && (
                    <Alert
                        message={error}
                        type="error"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                <form onSubmit={handleLogin}>
                    <Input
                        size="large"
                        placeholder="Email Nhân Viên"
                        prefix={<UserOutlined />}
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        style={{ marginBottom: 12, borderRadius: 8 }}
                    />

                    <Input.Password
                        size="large"
                        placeholder="Mật khẩu"
                        prefix={<LockOutlined />}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        style={{ marginBottom: 16, borderRadius: 8 }}
                    />

                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                        size="large"
                        style={{
                            borderRadius: 8,
                            background: "#ea580c",
                            borderColor: "#ea580c",
                            fontWeight: 600,
                        }}
                    >
                        Đăng Nhập
                    </Button>
                </form>
            </Card>
        </div>
    );
}
