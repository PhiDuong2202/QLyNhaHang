import { useEffect, useState, useMemo } from "react";
import {
  Table,
  Button,
  Input,
  InputNumber,
  Modal,
  Form,
  Space,
  Typography,
  message,
  Popconfirm,
  Tag,
  Card,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ImportOutlined,
  AlertOutlined,
} from "@ant-design/icons";
import api from "../../services/api";
import useDarkMode from "../../hooks/useDarkMode";

const { Title, Text } = Typography;

export default function Ingredients() {
  const darkMode = useDarkMode();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modals visibility
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Selected item for edit or import
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [importingIngredient, setImportingIngredient] = useState(null);
  
  const [form] = Form.useForm();
  const [importForm] = Form.useForm();

  const loadIngredients = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ingredients");
      setIngredients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách nguyên liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  const handleOpenAdd = () => {
    setEditingIngredient(null);
    form.resetFields();
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingIngredient(record);
    form.setFieldsValue(record);
    setIsAddEditModalOpen(true);
  };

  const handleOpenImport = (record) => {
    setImportingIngredient(record);
    importForm.resetFields();
    setIsImportModalOpen(true);
  };

  const handleSaveIngredient = async () => {
    try {
      const values = await form.validateFields();
      if (editingIngredient) {
        // Update
        await api.put(`/ingredients/${editingIngredient.id}`, values);
        message.success("Cập nhật nguyên liệu thành công");
      } else {
        // Create
        await api.post("/ingredients", values);
        message.success("Thêm nguyên liệu thành công");
      }
      setIsAddEditModalOpen(false);
      loadIngredients();
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi lưu nguyên liệu");
    }
  };

  const handleImportStock = async () => {
    try {
      const values = await importForm.validateFields();
      await api.post(`/ingredients/${importingIngredient.id}/import`, {
        amount: values.amount,
      });
      message.success(`Nhập kho thêm ${values.amount} ${importingIngredient.unit} thành công`);
      setIsImportModalOpen(false);
      loadIngredients();
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi nhập kho");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/ingredients/${id}`);
      message.success("Đã xóa nguyên liệu");
      loadIngredients();
    } catch (err) {
      console.error(err);
      message.error("Không thể xóa nguyên liệu");
    }
  };

  const columns = [
    {
      title: "Tên nguyên liệu",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => {
        const isLow = Number(record.quantity) < Number(record.min_quantity);
        return (
          <Space>
            <Text strong style={{ color: darkMode ? "#f8fafc" : "#0f172a" }}>{text}</Text>
            {isLow && (
              <Tag color="error" icon={<AlertOutlined />}>
                Cần nhập!
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Tồn kho hiện tại",
      dataIndex: "quantity",
      key: "quantity",
      sorter: (a, b) => Number(a.quantity) - Number(b.quantity),
      render: (val, record) => {
        const isLow = Number(val) < Number(record.min_quantity);
        return (
          <Text strong style={{ color: isLow ? "#ef4444" : (darkMode ? "#10b981" : "#059669"), fontSize: 16 }}>
            {Number(val).toLocaleString("vi-VN", { maximumFractionDigits: 3 })}
          </Text>
        );
      },
    },
    {
      title: "Đơn vị tính",
      dataIndex: "unit",
      key: "unit",
      render: (text) => <Tag color="default">{text}</Tag>,
    },
    {
      title: "Hạn mức tối thiểu",
      dataIndex: "min_quantity",
      key: "min_quantity",
      render: (val) => Number(val || 0).toLocaleString("vi-VN"),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => {
        const isLow = Number(record.quantity) < Number(record.min_quantity);
        return isLow ? (
          <Tag color="red">Sắp hết hàng</Tag>
        ) : (
          <Tag color="green">An toàn</Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            ghost
            icon={<ImportOutlined />}
            onClick={() => handleOpenImport(record)}
          >
            Nhập kho
          </Button>
          <Button
            type="dashed"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa nguyên liệu này? Các định lượng liên quan có thể bị ảnh hưởng."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} type="text" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, minHeight: "100vh", background: darkMode ? "#0b0f19" : "#f1f5f9" }}>
      <Card
        style={{
          borderRadius: 12,
          background: darkMode ? "#111827" : "#fff",
          border: darkMode ? "1px solid #1e293b" : "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <Title level={2} style={{ margin: 0, color: darkMode ? "#f8fafc" : "#0f172a" }}>
              📦 QUẢN LÝ KHO NGUYÊN LIỆU
            </Title>
            <Text type="secondary">
              Quản lý danh sách nguyên liệu, tồn kho thực tế và nhận cảnh báo khi sắp hết hàng
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={handleOpenAdd}
          >
            Thêm Nguyên Liệu
          </Button>
        </div>

        <Table
          dataSource={ingredients}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          style={{ background: "transparent" }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingIngredient ? "✍️ Cập Nhật Nguyên Liệu" : "➕ Thêm Nguyên Liệu Mới"}
        open={isAddEditModalOpen}
        onOk={handleSaveIngredient}
        onCancel={() => setIsAddEditModalOpen(false)}
        okText="Lưu lại"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Tên nguyên liệu"
            rules={[{ required: true, message: "Vui lòng nhập tên nguyên liệu" }]}
          >
            <Input placeholder="Ví dụ: Thịt bò, Bánh phở, Trứng, Cà chua..." />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Form.Item
              name="unit"
              label="Đơn vị tính"
              rules={[{ required: true, message: "Vui lòng nhập đơn vị tính" }]}
            >
              <Input placeholder="Ví dụ: kg, g, quả, chai, lon..." />
            </Form.Item>

            <Form.Item
              name="min_quantity"
              label="Hạn mức cảnh báo tối thiểu"
              initialValue={0}
              rules={[{ required: true, message: "Vui lòng nhập hạn mức cảnh báo" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} placeholder="Ví dụ: 5" />
            </Form.Item>
          </div>

          {!editingIngredient && (
            <Form.Item
              name="quantity"
              label="Số lượng tồn kho ban đầu"
              initialValue={0}
              rules={[{ required: true, message: "Vui lòng nhập số lượng ban đầu" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} placeholder="Ví dụ: 10" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Import Stock Modal */}
      <Modal
        title={`📥 Nhập Kho Nguyên Liệu: ${importingIngredient?.name}`}
        open={isImportModalOpen}
        onOk={handleImportStock}
        onCancel={() => setIsImportModalOpen(false)}
        okText="Xác nhận nhập kho"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={importForm} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: darkMode ? "#1f2937" : "#f8fafc" }}>
            <Text>Tồn kho hiện tại: </Text>
            <Text strong style={{ fontSize: 16, color: "#0284c7" }}>
              {importingIngredient && Number(importingIngredient.quantity).toLocaleString("vi-VN")} {importingIngredient?.unit}
            </Text>
          </div>

          <Form.Item
            name="amount"
            label={`Số lượng nhập thêm (${importingIngredient?.unit})`}
            rules={[{ required: true, message: "Vui lòng nhập số lượng nhập thêm" }]}
          >
            <InputNumber
              min={0.001}
              style={{ width: "100%" }}
              placeholder="Nhập số lượng thực tế..."
              autoFocus
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
