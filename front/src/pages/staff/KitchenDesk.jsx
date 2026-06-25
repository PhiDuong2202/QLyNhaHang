import { useEffect, useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Space,
  Empty,
  Spin,
  message,
  Divider,
  Badge,
  Tooltip,
} from "antd";
import {
  ClockCircleOutlined,
  PrinterOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  FireOutlined,
} from "@ant-design/icons";
import api from "../../services/api";
import useDarkMode from "../../hooks/useDarkMode";

const { Text, Title } = Typography;

export default function KitchenDesk() {
  const darkMode = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [activeOrderToPrint, setActiveOrderToPrint] = useState(null);

  // Load data from the consolidated sync endpoint
  const loadSyncData = async ({ silent = false } = {}) => {
    if (!silent) setIsFetching(true);
    try {
      const res = await api.get("/sync");
      const fetchedOrders = Array.isArray(res.data?.orders) ? res.data.orders : [];
      const fetchedTables = Array.isArray(res.data?.tables) ? res.data.tables : [];
      
      setTables(fetchedTables);
      
      setOrders((prevOrders) => {
        // Detect new orders and alert kitchen staff
        if (prevOrders.length > 0 && fetchedOrders.length > prevOrders.length) {
          const prevOrderIds = prevOrders.map((o) => o.id);
          const newOrders = fetchedOrders.filter((o) => !prevOrderIds.includes(o.id));
          
          newOrders.forEach((o) => {
            const tableName = o.table?.name || "Khách mang về";
            message.info({
              content: `🔔 Có ĐƠN HÀNG MỚI từ ${tableName}!`,
              duration: 5,
              style: { fontSize: 16, fontWeight: "bold" },
            });
            // Try to play a notification sound
            try {
              const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav");
              audio.volume = 0.5;
              audio.play();
            } catch (e) {
              console.log("Sound play blocked");
            }
          });
        }
        return fetchedOrders;
      });
    } catch (err) {
      console.error("Lỗi đồng bộ bếp:", err);
      if (!silent) message.error("Không thể đồng bộ dữ liệu bếp");
    } finally {
      setIsFetching(false);
    }
  };

  // Coordinated Polling every 3 seconds
  useEffect(() => {
    loadSyncData();
    const interval = setInterval(() => {
      loadSyncData({ silent: true });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update status of an individual item
  const updateItemStatus = async (itemId, newStatus) => {
    setLoading(true);
    try {
      await api.put(`/order-items/${itemId}`, { status: newStatus });
      message.success("Cập nhật trạng thái món thành công");
      loadSyncData({ silent: true });
    } catch (err) {
      console.error(err);
      message.error("Không cập nhật được trạng thái món");
    } finally {
      setLoading(false);
    }
  };

  // Update status of all items in an order
  const updateAllItemsStatus = async (order, newStatus) => {
    setLoading(true);
    try {
      await Promise.all(
        order.orderItems.map((item) =>
          api.put(`/order-items/${item.id}`, { status: newStatus })
        )
      );
      
      // If completing all items, we can also update order status to "processing" (Đang chế biến)
      // or keep it as is.
      if (newStatus === "ready") {
        await api.put(`/orders/${order.id}`, { status: "processing" });
      }
      
      message.success(`Đã chuyển toàn bộ món sang: ${
        newStatus === "cooking" ? "Đang chế biến" : "Hoàn thành"
      }`);
      loadSyncData({ silent: true });
    } catch (err) {
      console.error(err);
      message.error("Không cập nhật được trạng thái đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // Print ticket via browser window.print()
  const handlePrintTicket = (order) => {
    setActiveOrderToPrint(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Calculate elapsed time in minutes
  const getElapsedTime = (createdAt) => {
    const start = new Date(createdAt);
    const now = new Date();
    return Math.floor((now - start) / 60000);
  };

  // Render elapsed time tag with warning colors
  const renderElapsedTag = (minutes) => {
    let color = "success";
    let text = `${minutes}m`;
    
    if (minutes >= 20) {
      color = "error";
      text = `🔥 TRỄ: ${minutes} phút`;
    } else if (minutes >= 10) {
      color = "warning";
      text = `⏳ Chờ: ${minutes} phút`;
    } else {
      text = `⏱ Chờ: ${minutes} phút`;
    }
    
    return (
      <Tag
        color={color}
        style={{
          fontSize: 13,
          fontWeight: 700,
          padding: "4px 8px",
          borderRadius: 4,
          animation: minutes >= 20 ? "pulse 1.5s infinite" : "none",
        }}
      >
        <ClockCircleOutlined /> {text}
      </Tag>
    );
  };

  const getOrderTypeTag = (type) => {
    switch (type) {
      case "dine_in":
        return <Tag color="blue">Tại chỗ</Tag>;
      case "take_away":
        return <Tag color="volcano">Mang về</Tag>;
      case "preorder":
        return <Tag color="purple">Đặt trước</Tag>;
      default:
        return <Tag>{type}</Tag>;
    }
  };

  const getItemStatusTag = (status) => {
    switch (status) {
      case "pending":
        return <Badge status="default" text="Chờ làm" />;
      case "cooking":
        return <Badge status="processing" text="Đang chế biến" style={{ color: "#d97706" }} />;
      case "ready":
        return <Badge status="success" text="Đã xong" />;
      case "served":
        return <Badge status="warning" text="Đã phục vụ" />;
      default:
        return <Badge text={status} />;
    }
  };

  const styles = useMemo(
    () => ({
      container: {
        padding: 24,
        minHeight: "100vh",
        background: darkMode ? "#0b0f19" : "#f1f5f9",
        transition: "all 0.3s",
      },
      header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
      },
      grid: {
        marginTop: 16,
      },
      orderCard: (minutes, darkMode) => {
        let borderColor = darkMode ? "#1e293b" : "#e2e8f0";
        let shadow = "none";
        
        if (minutes >= 20) {
          borderColor = "#ef4444";
          shadow = "0 0 12px rgba(239, 68, 68, 0.2)";
        } else if (minutes >= 10) {
          borderColor = "#f59e0b";
        }
        
        return {
          borderRadius: 12,
          border: `2px solid ${borderColor}`,
          background: darkMode ? "#111827" : "#fff",
          boxShadow: shadow,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        };
      },
      cardHeader: {
        padding: "12px 16px",
        background: darkMode ? "#1f2937" : "#f8fafc",
        borderBottom: darkMode ? "1px solid #374151" : "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      },
      cardBody: {
        padding: 16,
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
      },
      itemList: {
        flexGrow: 1,
        marginBottom: 16,
      },
      itemRow: (status, darkMode) => ({
        padding: "10px 0",
        borderBottom: darkMode ? "1px solid #1f2937" : "1px solid #f1f5f9",
        background: status === "cooking"
          ? darkMode ? "rgba(217, 119, 6, 0.08)" : "rgba(245, 158, 11, 0.05)"
          : status === "ready"
          ? darkMode ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.05)"
          : "transparent",
        opacity: status === "ready" || status === "served" ? 0.6 : 1,
      }),
      itemDetails: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      },
      notes: {
        fontSize: 12,
        color: "#f59e0b",
        fontWeight: "600",
        marginTop: 4,
        display: "block",
      },
      cardFooter: {
        padding: "12px 16px",
        borderTop: darkMode ? "1px solid #1f2937" : "1px solid #f1f5f9",
        background: darkMode ? "#111827" : "#fff",
      },
      printArea: {
        display: "none",
      },
    }),
    [darkMode]
  );

  return (
    <div style={styles.container}>
      {/* CSS keyframe animations */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            70% { transform: scale(1.02); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
          
          @media print {
            body * {
              visibility: hidden;
            }
            #kitchen-print-ticket, #kitchen-print-ticket * {
              visibility: visible;
            }
            #kitchen-print-ticket {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm;
              padding: 5mm;
              font-family: 'Courier New', Courier, monospace;
              color: #000;
              background: #fff;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      {/* Header section */}
      <div style={styles.header} className="no-print">
        <div>
          <Title level={2} style={{ margin: 0, color: darkMode ? "#f8fafc" : "#0f172a" }}>
            🍳 MÀN HÌNH BẾP (KDS)
          </Title>
          <Text style={{ color: darkMode ? "#94a3b8" : "#475569" }}>
            Hệ thống hiển thị và điều phối chế biến món ăn thời gian thực
          </Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => loadSyncData()}
            loading={isFetching}
          >
            Làm mới
          </Button>
        </Space>
      </div>

      {isFetching && orders.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }} className="no-print">
          <Spin size="large" tip="Đang kết nối dữ liệu phòng bếp..." />
        </div>
      ) : orders.length === 0 ? (
        <div style={{ background: darkMode ? "#111827" : "#fff", padding: "60px 0", borderRadius: 12 }} className="no-print">
          <Empty description="Không có đơn hàng nào cần chế biến" />
        </div>
      ) : (
        <Row gutter={[16, 16]} style={styles.grid} className="no-print">
          {orders.map((order) => {
            const elapsed = getElapsedTime(order.created_at);
            const tableName = order.table?.name || "Khách mang về";
            
            // Check if there are items to make
            const items = order.orderItems || [];
            
            return (
              <Col key={order.id} xs={24} md={12} lg={8}>
                <div style={styles.orderCard(elapsed, darkMode)}>
                  {/* Card Header */}
                  <div style={styles.cardHeader}>
                    <div>
                      <Title level={4} style={{ margin: 0, color: darkMode ? "#f8fafc" : "#0f172a", display: "inline-block", marginRight: 8 }}>
                        📌 {tableName}
                      </Title>
                      {getOrderTypeTag(order.order_type)}
                    </div>
                    {renderElapsedTag(elapsed)}
                  </div>

                  {/* Card Body */}
                  <div style={styles.cardBody}>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Mã đơn: #{order.id} | Giờ đặt: {new Date(order.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                      {order.customer && (
                        <div style={{ marginTop: 4 }}>
                          <Tag color="cyan" style={{ fontSize: 11 }}>
                            👤 {order.customer.name} - {order.customer.phone}
                          </Tag>
                        </div>
                      )}
                    </div>
                    
                    <Divider style={{ margin: "8px 0" }} />

                    {/* Items List */}
                    <div style={styles.itemList}>
                      {items.map((item) => {
                        const isPending = item.status === "pending" || !item.status;
                        const isCooking = item.status === "cooking";
                        const isReady = item.status === "ready" || item.status === "served";

                        return (
                          <div key={item.id} style={styles.itemRow(item.status, darkMode)}>
                            <div style={styles.itemDetails}>
                              <div style={{ flex: 1 }}>
                                <Text strong style={{ fontSize: 15, color: darkMode ? "#f1f5f9" : "#1e293b" }}>
                                  <span style={{ fontSize: 18, color: "#2563eb", marginRight: 8 }}>
                                    {item.quantity}x
                                  </span>
                                  {item.product?.name || `Món ${item.product_id}`}
                                </Text>
                                {item.notes && (
                                  <span style={styles.notes}>✍️ Lưu ý: {item.notes}</span>
                                )}
                              </div>
                              
                              {/* Item Action Buttons */}
                              <Space>
                                {getItemStatusTag(item.status)}
                                {isPending && (
                                  <Tooltip title="Bắt đầu chế biến">
                                    <Button
                                      size="small"
                                      type="primary"
                                      ghost
                                      icon={<FireOutlined />}
                                      onClick={() => updateItemStatus(item.id, "cooking")}
                                    />
                                  </Tooltip>
                                )}
                                {isCooking && (
                                  <Tooltip title="Hoàn thành món">
                                    <Button
                                      size="small"
                                      type="primary"
                                      icon={<CheckCircleOutlined />}
                                      style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
                                      onClick={() => updateItemStatus(item.id, "ready")}
                                    />
                                  </Tooltip>
                                )}
                              </Space>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Card Footer Actions */}
                    <div style={styles.cardFooter}>
                      <Row gutter={8}>
                        <Col span={8}>
                          <Button
                            block
                            icon={<PrinterOutlined />}
                            onClick={() => handlePrintTicket(order)}
                          >
                            In phiếu
                          </Button>
                        </Col>
                        <Col span={8}>
                          <Button
                            block
                            type="dashed"
                            icon={<PlayCircleOutlined />}
                            disabled={!items.some((i) => i.status === "pending" || !i.status)}
                            onClick={() => updateAllItemsStatus(order, "cooking")}
                          >
                            Làm tất
                          </Button>
                        </Col>
                        <Col span={8}>
                          <Button
                            block
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            style={{ backgroundColor: "#059669", borderColor: "#059669" }}
                            disabled={!items.some((i) => i.status !== "ready" && i.status !== "served")}
                            onClick={() => updateAllItemsStatus(order, "ready")}
                          >
                            Xong tất
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Printer-friendly Thermal Receipt Layout */}
      {activeOrderToPrint && (
        <div id="kitchen-print-ticket" style={{ display: "none" }}>
          <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: 5, marginBottom: 5 }}>
            <h2 style={{ margin: "0 0 5px 0", fontSize: 18 }}>NHÀ HÀNG QUÁN ĂN</h2>
            <h3 style={{ margin: "0 0 5px 0", fontSize: 16 }}>PHIẾU CHẾ BIẾN BẾP</h3>
            <p style={{ margin: 0, fontSize: 12 }}>Đơn hàng: #{activeOrderToPrint.id}</p>
            <p style={{ margin: 0, fontSize: 12 }}>Ngày đặt: {new Date(activeOrderToPrint.created_at).toLocaleString("vi-VN")}</p>
          </div>
          <div style={{ marginBottom: 8 }}>
            <p style={{ margin: "3px 0", fontSize: 14 }}><strong>BÀN: {activeOrderToPrint.table?.name || "MANG VỀ"}</strong></p>
            <p style={{ margin: "3px 0", fontSize: 12 }}>Loại đơn: {activeOrderToPrint.order_type === "dine_in" ? "Tại chỗ" : activeOrderToPrint.order_type === "take_away" ? "Mang về" : "Đặt trước"}</p>
            {activeOrderToPrint.customer && (
              <p style={{ margin: "3px 0", fontSize: 12 }}>Khách hàng: {activeOrderToPrint.customer.name} - {activeOrderToPrint.customer.phone}</p>
            )}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "5px 0" }}>
            <thead>
              <tr style={{ borderBottom: "1px dashed #000" }}>
                <th style={{ textAlign: "left", fontSize: 12, padding: "3px 0" }}>Món</th>
                <th style={{ textAlign: "right", fontSize: 12, padding: "3px 0", width: 40 }}>SL</th>
              </tr>
            </thead>
            <tbody>
              {activeOrderToPrint.orderItems?.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px dotted #000" }}>
                  <td style={{ fontSize: 13, padding: "4px 0" }}>
                    <strong>{item.product?.name}</strong>
                    {item.notes && (
                      <div style={{ fontSize: 11, fontStyle: "italic", margin: "2px 0 0 5px", color: "#000" }}>
                        * Ghi chú: {item.notes}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: "right", fontSize: 15, fontWeight: "bold", padding: "4px 0" }}>
                    {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: "center", marginTop: 15, fontSize: 11 }}>
            <p style={{ margin: 0 }}>Vui lòng chuẩn bị món ăn nhanh chóng.</p>
            <p style={{ margin: "5px 0 0 0", fontStyle: "italic" }}>--- Hệ thống KDS ---</p>
          </div>
        </div>
      )}
    </div>
  );
}
