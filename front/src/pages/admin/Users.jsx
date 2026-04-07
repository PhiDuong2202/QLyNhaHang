import { useEffect, useState } from "react";
import { Button, Card, Form, Input, Modal, Select, Space, Table, Typography, message, Tag } from "antd";
import api from "../../services/api";

const { Title } = Typography;

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);

  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get("/users"),
        api.get("/roles")
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (err) {
      console.log(err);
      message.error("Lỗi khi tải dữ liệu tài khoản");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingData(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingData(record);
    form.setFieldsValue({ ...record, password: "" }); 
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) return;
    try {
      await api.delete(`/users/${id}`);
      message.success("Đã xóa tài khoản");
      loadData();
    } catch (err) {
      console.log(err);
      message.error("Xóa thất bại");
    }
  };

  const onFinish = async (values) => {
    try {
      if (editingData) {
        await api.put(`/users/${editingData.id}`, values);
        message.success("Cập nhật thành công");
      } else {
        await api.post("/users", values);
        message.success("Đã thêm tài khoản mới");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.log(err);
      message.error("Có lỗi xảy ra, vui lòng kiểm tra lại email hoặc mật khẩu");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "Họ và tên", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { 
      title: "Chức vụ", 
      dataIndex: ["role", "name"], 
      key: "role",
      render: (roleName) => (
        <Tag color={roleName === 'Admin' ? 'red' : 'blue'}>{roleName || "Nhân viên"}</Tag>
      )
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEditModal(record)}>Sửa</Button>
          <Button size="small" danger onClick={() => handleDelete(record.id)}>Xóa</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Quản lý Tài khoản</Title>
        <Button type="primary" onClick={openAddModal}>+ Thêm Tài Khoản</Button>
      </div>

      <Card>
        <Table rowKey="id" loading={loading} columns={columns} dataSource={users} />
      </Card>

      <Modal
        title={editingData ? "Sửa tài khoản" : "Thêm tài khoản"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: "Vui lòng nhập tên!" }]}>
            <Input />
          </Form.Item>
          
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Vui lòng nhập email hợp lệ!" }]}>
            <Input />
          </Form.Item>
          
          <Form.Item 
            name="password" 
            label={editingData ? "Mật khẩu mới (bỏ trống nếu không đổi)" : "Mật khẩu"} 
            rules={[{ required: !editingData, message: "Vui lòng nhập mật khẩu!" }, { min: 6, message: "Ít nhất 6 ký tự" }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item name="role_id" label="Chức vụ" rules={[{ required: true, message: "Vui lòng chọn chức vụ!" }]}>
            <Select>
              {roles.map(r => <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>)}
            </Select>
          </Form.Item>

          <Form.Item style={{ textAlign: "right", margin: 0 }}>
            <Button onClick={() => setIsModalOpen(false)} style={{ marginRight: 8 }}>Hủy</Button>
            <Button type="primary" htmlType="submit">Lưu</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
