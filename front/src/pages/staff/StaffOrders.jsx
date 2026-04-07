import { useEffect, useState } from "react";
import { Button, Card, Space, Table, Tag, Typography, message, Radio, Modal, Divider } from "antd";
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
  const [statusFilter, setStatusFilter] = useState("active");
  const [viewingOrder, setViewingOrder] = useState(null);
  const [payingOrder, setPayingOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");

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

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "active") return o.status === "pending" || o.status === "processing";
    if (statusFilter === "completed") return o.status === "completed";
    if (statusFilter === "cancelled") return o.status === "cancelled";
    return true;
  });

  const changeStatus = async (order, status, method = null) => {
    try {
      await api.put(`/orders/${order.id}`, { 
        status, 
        ...(method ? { payment_method: method } : {}) 
      });
      message.success("Cập nhật trạng thái thành công");
      fetchOrders();
    } catch (err) {
      console.log(err);
      message.error("Không cập nhật được trạng thái");
    }
  };

  const handlePayConfirm = async () => {
    if (!payingOrder) return;
    await changeStatus(payingOrder, "completed", paymentMethod);
    setPayingOrder(null);
    setPaymentMethod("cash");
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
      render: (_, record) => record.table_id ? (record.table?.name || `Bàn ${record.table_id}`) : (record.order_type === 'take_away' ? 'Mang về' : 'Khách đặt'),
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
          <Button size="small" onClick={() => setViewingOrder(record)}>
            Chi tiết
          </Button>
          {(record.status === "pending" || record.status === "processing") && (
            <>
              {record.status === "pending" && (
                <Button size="small" onClick={() => changeStatus(record, "processing")}>
                  Nhận làm
                </Button>
              )}
              <Button
                size="small"
                type="primary"
                onClick={() => setPayingOrder(record)}
              >
                Thanh toán
              </Button>
              <Button danger size="small" onClick={() => changeStatus(record, "cancelled")}>
                Hủy
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Quản lý Đơn hàng</Title>
        <Radio.Group value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <Radio.Button value="active">Đang xử lý</Radio.Button>
          <Radio.Button value="completed">Đã hoàn thành</Radio.Button>
          <Radio.Button value="cancelled">Đơn hủy</Radio.Button>
        </Radio.Group>
      </div>
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredOrders}
        />
      </Card>

      <Modal
        title="Chi tiết đơn hàng"
        open={!!viewingOrder}
        onCancel={() => setViewingOrder(null)}
        footer={[
          <Button key="close" onClick={() => setViewingOrder(null)}>Đóng</Button>,
          <Button key="print" type="primary" onClick={() => window.print()}>In hóa đơn</Button>
        ]}
        width={500}
      >
        {viewingOrder && (
          <div id="invoice-print-area">
            <h2 style={{ textAlign: "center", marginBottom: 4 }}>HÓA ĐƠN BÁN HÀNG</h2>
            <div style={{ textAlign: "center", marginBottom: 16, color: "#888" }}>
              #{viewingOrder.id} - {new Date(viewingOrder.created_at).toLocaleString('vi-VN')}
            </div>
            
            <p><strong>Loại/Bàn:</strong> {viewingOrder.table_id ? (viewingOrder.table?.name || viewingOrder.table_id) : (viewingOrder.order_type === 'take_away' ? 'Mang về' : 'Khác')}</p>
            <p><strong>Khách hàng:</strong> {viewingOrder.customer?.name || "Khách lẻ"}{viewingOrder.customer?.phone ? ` (${viewingOrder.customer.phone})` : ""}</p>
            <Divider dashed />
            <Table 
              dataSource={viewingOrder.order_items || viewingOrder.orderItems || []} 
              pagination={false} 
              rowKey="id"
              size="small"
              columns={[
                { title: "Món ăn", dataIndex: ["product", "name"], key: "name" },
                { title: "SL", dataIndex: "quantity", key: "qty", align: 'center', width: 60 },
                { 
                  title: "Thành tiền", 
                  key: "total", 
                  align: 'right',
                  render: (_, item) => `${Number(item.quantity * (item.product?.price || 0)).toLocaleString("vi-VN")} đ` 
                }
              ]} 
            />
            <Divider dashed />
            <h3 style={{ textAlign: "right" }}>Tổng cộng: {`${Number(viewingOrder.total_price || 0).toLocaleString("vi-VN")} đ`}</h3>
            
            <style>{`
              @media print {
                body * { visibility: hidden; }
                #invoice-print-area, #invoice-print-area * { visibility: visible; }
                #invoice-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
              }
            `}</style>
          </div>
        )}
      </Modal>

      <Modal
        title="Thanh toán đơn hàng"
        open={!!payingOrder}
        onCancel={() => setPayingOrder(null)}
        footer={[
          <Button key="cancel" onClick={() => setPayingOrder(null)}>Hủy</Button>,
          <Button key="confirm" type="primary" onClick={handlePayConfirm}>Xác nhận hoàn thành</Button>
        ]}
      >
        {payingOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ textAlign: "center", fontSize: "16px" }}>
              Tổng tiền cần thanh toán: <strong style={{ color: "#e11d48", fontSize: "20px" }}>{`${Number(payingOrder.total_price || 0).toLocaleString("vi-VN")} đ`}</strong>
            </div>
            
            <div style={{ textAlign: "center" }}>
              <strong>Phương thức thanh toán:</strong>
              <div style={{ marginTop: "12px" }}>
                <Radio.Group 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="cash">Tiền mặt</Radio.Button>
                  <Radio.Button value="transfer">Chuyển khoản</Radio.Button>
                </Radio.Group>
              </div>
            </div>

            {paymentMethod === "transfer" && (
              <div style={{ textAlign: "center", marginTop: "10px", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
                <p style={{ marginBottom: "12px", color: "#64748b" }}>Vui lòng đưa khách hàng quét mã QR dưới đây</p>
                <img 
                  src={`https://img.vietqr.io/image/bidv-0977902004-compact2.png?amount=${payingOrder.total_price}&addInfo=Thanh toan don ${payingOrder.id}&accountName=NGUYEN PHI DUONG`} 
                  alt="QR Code" 
                  style={{ maxWidth: "250px", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "4px", background: "white" }} 
                />
              </div>
            )}
            {paymentMethod === "cash" && (
              <div style={{ textAlign: "center", color: "#16a34a", marginTop: "10px", padding: "20px", background: "#f0fdf4", borderRadius: "8px" }}>
                <p>Khách hàng thanh toán bằng tiền mặt.<br/>Vui lòng kiểm tra kỹ số tiền nhận được trước khi xác nhận.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
