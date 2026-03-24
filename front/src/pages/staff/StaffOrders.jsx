import { useEffect, useState } from "react";
import { Button, Card, Space, Table, Tag, Typography, message } from "antd";
import api from "../../services/api";

const { Title } = Typography;

const statusColor = {
  pending: "orange",
  processing: "blue",
  completed: "green",
  cancelled: "red",
};

export default function StaffOrders() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/orders");
      const list = Array.isArray(res.data) ? res.data : [];
      setOrders(list);
    } catch (err) {
      console.log(err);
      message.error("Không tải được danh sách đơn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const changeStatus = async (order, status) => {
    try {
      await api.put(`/orders/${order.id}`, { status });
      message.success("Cập nhật trạng thái thành công");
      fetchOrders();
    } catch (err) {
      console.log(err);
      message.error("Không cập nhật được trạng thái");
    }
  };

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      key: "id",
      width: 100,
    },
    {
      title: "Khách",
      key: "customer",
      render: (_, record) => record.customer?.name || "Khách lẻ",
    },
    {
      title: "Bàn",
      key: "table",
      render: (_, record) => record.table?.name || `Bàn ${record.table_id}`,
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      render: (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (value) => <Tag color={statusColor[value] || "default"}>{value}</Tag>,
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => changeStatus(record, "processing")}>
            Nhận làm
          </Button>
          <Button
            size="small"
            type="primary"
            onClick={() => changeStatus(record, "completed")}
          >
            Hoàn thành
          </Button>
          <Button danger size="small" onClick={() => changeStatus(record, "cancelled")}>
            Hủy
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Đơn đang xử lý</Title>
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={orders}
        />
      </Card>
    </div>
  );
}
