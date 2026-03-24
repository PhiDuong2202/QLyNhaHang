import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import api from "../../services/api";

const { Title } = Typography;

const getList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default function Customers() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/customers");
      setCustomers(getList(res?.data));
    } catch (err) {
      console.log(err);
      message.error("Không tải được danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return customers;

    return customers.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [customers, keyword]);

  const handleCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpenModal(true);
  };

  const handleEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      phone: record.phone,
    });
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload = {
        name: values.name?.trim(),
        phone: values.phone?.trim() || null,
      };

      if (editing) {
        await api.put(`/customers/${editing.id}`, payload);
        message.success("Cập nhật khách hàng thành công");
      } else {
        await api.post("/customers", payload);
        message.success("Thêm khách hàng thành công");
      }

      setOpenModal(false);
      setEditing(null);
      form.resetFields();
      fetchCustomers();
    } catch (err) {
      if (err?.errorFields) return;
      console.log(err);
      message.error("Không lưu được dữ liệu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/customers/${id}`);
      message.success("Xóa khách hàng thành công");
      fetchCustomers();
    } catch (err) {
      console.log(err);
      message.error("Không xóa được khách hàng");
    }
  };

  const columns = [
    {
      title: "STT",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Tên khách hàng",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      render: (value) => value || "-",
    },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa khách hàng này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Quản lý khách hàng</Title>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Tìm theo tên hoặc số điện thoại"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Button type="primary" onClick={handleCreate}>
            + Thêm khách hàng
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredCustomers}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editing ? "Cập nhật khách hàng" : "Thêm khách hàng"}
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onOk={handleSubmit}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={saving}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Tên khách hàng"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên khách hàng" }]}
          >
            <Input placeholder="Nhập tên khách hàng" />
          </Form.Item>

          <Form.Item label="Số điện thoại" name="phone">
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
