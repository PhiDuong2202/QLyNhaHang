import { useEffect, useMemo, useState } from "react";
import { Card, Col, Row, Select, DatePicker, Statistic, Table, Tag, Tabs, Empty } from "antd";
import {
  DollarCircleOutlined,
  CreditCardOutlined,
  BarChartOutlined,
  FileTextOutlined,
  FireOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";
import useDarkMode from "../../hooks/useDarkMode";

const periodOptions = [
  { value: "day", label: "Ngày" },
  { value: "month", label: "Tháng" },
  { value: "year", label: "Năm" },
];

const getList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

// Custom SVG Trend Chart Component
function TrendChart({ data, periodType, darkMode }) {
  if (!data || data.length === 0) return <Empty description="Không có dữ liệu biểu đồ" />;

  const margin = { top: 20, right: 20, bottom: 40, left: 65 };
  const width = 650;
  const height = 280;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 100000); // Minimum max of 100k to avoid flat lines

  const points = data.map((d, i) => {
    const x = margin.left + (i / (data.length - 1 || 1)) * chartWidth;
    const y = margin.top + chartHeight - (d.value / maxValue) * chartHeight;
    return { x, y, label: d.label, value: d.value };
  });

  let linePath = "";
  let areaPath = "";
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
    areaPath = `${linePath} L ${points[points.length - 1].x} ${margin.top + chartHeight} L ${points[0].x} ${margin.top + chartHeight} Z`;
  }

  const gridLines = [];
  const ticksCount = 5;
  for (let i = 0; i <= ticksCount; i++) {
    const val = (maxValue / ticksCount) * i;
    const y = margin.top + chartHeight - (val / maxValue) * chartHeight;
    gridLines.push({ y, value: val });
  }

  const formatShortMoney = (val) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return `${val}`;
  };

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ minWidth: 550 }}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gridlines & Y-axis labels */}
        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line
              x1={margin.left}
              y1={line.y}
              x2={width - margin.right}
              y2={line.y}
              stroke={darkMode ? "#1e293b" : "#e2e8f0"}
              strokeDasharray="4 4"
            />
            <text
              x={margin.left - 10}
              y={line.y + 4}
              textAnchor="end"
              fill={darkMode ? "#94a3b8" : "#64748b"}
              style={{ fontSize: 11, fontFamily: "'Inter', sans-serif" }}
            >
              {formatShortMoney(line.value)}
            </text>
          </g>
        ))}

        {/* Area under the line */}
        {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

        {/* The trend line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill="#3b82f6"
              stroke={darkMode ? "#111827" : "#fff"}
              strokeWidth="2.5"
              style={{ transition: "all 0.2s" }}
            />
            <title>{`${p.label}: ${formatCurrency(p.value)}`}</title>
          </g>
        ))}

        {/* X labels */}
        {points.map((p, idx) => {
          // If monthly report, thin out X-labels
          const showLabel =
            periodType !== "month" ||
            idx === 0 ||
            idx === points.length - 1 ||
            (idx + 1) % 5 === 0;

          if (!showLabel) return null;

          return (
            <text
              key={idx}
              x={p.x}
              y={height - margin.bottom + 22}
              textAnchor="middle"
              fill={darkMode ? "#94a3b8" : "#64748b"}
              style={{ fontSize: 10, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
            >
              {p.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// Custom Horizontal Bar Chart for Top Products
function ProductBarChart({ data, darkMode }) {
  if (!data || data.length === 0) return <Empty description="Không có dữ liệu món ăn" />;

  const topData = data.slice(0, 5); // display top 5
  const maxVal = Math.max(...topData.map((d) => d.revenue), 1);

  return (
    <div style={{ padding: "8px 4px" }}>
      {topData.map((item, index) => {
        const percentage = (item.revenue / maxVal) * 100;
        return (
          <div key={item.id} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: darkMode ? "#e2e8f0" : "#1e293b" }}>
                <span style={{ marginRight: 6 }}>
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}
                </span>
                {item.name}
                <span style={{ fontWeight: 400, color: "#64748b", marginLeft: 8 }}>
                  (Đã bán: {item.quantity})
                </span>
              </span>
              <span style={{ fontWeight: 700, color: "#10b981" }}>
                {formatCurrency(item.revenue)}
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: 10,
                background: darkMode ? "#1e293b" : "#f1f5f9",
                borderRadius: 5,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${percentage}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
                  borderRadius: 5,
                  transition: "width 1s ease-in-out",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Revenue() {
  const darkMode = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [periodType, setPeriodType] = useState("day");
  const [selectedDate, setSelectedDate] = useState(dayjs());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [payRes, ordRes, catRes] = await Promise.all([
          api.get("/payments"),
          api.get("/orders"),
          api.get("/categories"),
        ]);
        setPayments(getList(payRes?.data));
        setOrders(getList(ordRes?.data));
        setCategories(getList(catRes?.data));
      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const isMatchPeriod = (dateStr) => {
    if (!dateStr || !selectedDate) return false;
    const itemDate = dayjs(dateStr);
    if (!itemDate.isValid()) return false;

    if (periodType === "day") {
      return itemDate.isSame(selectedDate, "day");
    }
    if (periodType === "month") {
      return itemDate.isSame(selectedDate, "month");
    }
    return itemDate.isSame(selectedDate, "year");
  };

  // Filtered payments for selected period
  const filteredPayments = useMemo(
    () => payments.filter((p) => isMatchPeriod(p.created_at)),
    [payments, periodType, selectedDate]
  );

  // Total revenue from cash payments
  const totalRevenue = useMemo(
    () => filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [filteredPayments]
  );

  const paymentCount = filteredPayments.length;
  const avgOrderValue = paymentCount > 0 ? totalRevenue / paymentCount : 0;

  // Revenue trend grouping
  const trendData = useMemo(() => {
    if (periodType === "day") {
      // Group by 2-hour intervals
      const hours = Array.from({ length: 12 }, (_, i) => ({
        label: `${i * 2}h-${(i + 1) * 2}h`,
        value: 0,
      }));
      filteredPayments.forEach((p) => {
        const hour = dayjs(p.created_at).hour();
        const index = Math.min(Math.floor(hour / 2), 11);
        hours[index].value += Number(p.amount || 0);
      });
      return hours;
    } else if (periodType === "month") {
      // Group by days in month
      const daysCount = selectedDate.daysInMonth();
      const days = Array.from({ length: daysCount }, (_, i) => ({
        label: `${i + 1}`,
        value: 0,
      }));
      filteredPayments.forEach((p) => {
        const day = dayjs(p.created_at).date();
        if (day >= 1 && day <= daysCount) {
          days[day - 1].value += Number(p.amount || 0);
        }
      });
      return days;
    } else {
      // Group by month of year
      const months = Array.from({ length: 12 }, (_, i) => ({
        label: `Thg ${i + 1}`,
        value: 0,
      }));
      filteredPayments.forEach((p) => {
        const month = dayjs(p.created_at).month();
        months[month].value += Number(p.amount || 0);
      });
      return months;
    }
  }, [filteredPayments, periodType, selectedDate]);

  // Aggregate Product Sales Report
  const productSalesReport = useMemo(() => {
    // 1. Filter completed orders in selected period
    const matchedOrders = orders.filter((o) => {
      const isCompleted = o.status === "completed" || o.status === "Đã thanh toán";
      return isCompleted && isMatchPeriod(o.created_at);
    });

    // 2. Aggregate quantities and revenues
    const productMap = {};
    let totalQty = 0;
    let totalRev = 0;

    matchedOrders.forEach((o) => {
      const items = o.order_items || o.orderItems || [];
      items.forEach((item) => {
        const prod = item.product;
        if (!prod) return;

        const productId = prod.id;
        const qty = Number(item.quantity || 0);
        const price = Number(item.price || prod.price || 0);
        const itemRevenue = qty * price;

        totalQty += qty;
        totalRev += itemRevenue;

        if (productMap[productId]) {
          productMap[productId].quantity += qty;
          productMap[productId].revenue += itemRevenue;
        } else {
          const cat = categories.find((c) => c.id === prod.category_id);
          productMap[productId] = {
            id: productId,
            name: prod.name,
            categoryName: prod.category?.name || cat?.name || "Món ăn",
            price: price,
            quantity: qty,
            revenue: itemRevenue,
          };
        }
      });
    });

    const reportList = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);

    const finalReport = reportList.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      contribution: totalRev > 0 ? ((item.revenue / totalRev) * 100).toFixed(1) : "0.0",
    }));

    return {
      items: finalReport,
      totalQuantity: totalQty,
      totalRevenue: totalRev,
    };
  }, [orders, categories, periodType, selectedDate]);

  const topProduct = productSalesReport.items[0];

  // Table columns for Payments
  const paymentColumns = [
    {
      title: "Mã giao dịch",
      dataIndex: "id",
      key: "id",
      width: 130,
      render: (value) => <strong>#{value}</strong>,
    },
    {
      title: "Mã đơn hàng",
      dataIndex: "order_id",
      key: "order_id",
      width: 120,
      render: (value) => (value ? `#${value}` : "-"),
    },
    {
      title: "Phương thức",
      dataIndex: "method",
      key: "method",
      width: 150,
      render: (value) => (
        <Tag color={value === "card" || value === "chuyển khoản" ? "cyan" : "blue"}>
          {value ? value.toUpperCase() : "TIỀN MẶT"}
        </Tag>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (value) => <strong>{formatCurrency(Number(value || 0))}</strong>,
    },
    {
      title: "Thời gian",
      dataIndex: "created_at",
      key: "created_at",
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-"),
    },
  ];

  // Table columns for Product Sales Report
  const productColumns = [
    {
      title: "Hạng",
      dataIndex: "rank",
      key: "rank",
      width: 80,
      align: "center",
      render: (rank) => {
        if (rank === 1) return <span style={{ fontSize: 18 }}>🥇</span>;
        if (rank === 2) return <span style={{ fontSize: 18 }}>🥈</span>;
        if (rank === 3) return <span style={{ fontSize: 18 }}>🥉</span>;
        return <span style={{ fontWeight: 600, color: "#64748b" }}>{rank}</span>;
      },
    },
    {
      title: "Tên món ăn",
      dataIndex: "name",
      key: "name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Danh mục",
      dataIndex: "categoryName",
      key: "categoryName",
      render: (text) => <Tag color="geekblue">{text}</Tag>,
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      key: "price",
      render: (value) => formatCurrency(value),
    },
    {
      title: "Số lượng bán",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      render: (value) => <strong style={{ color: "#10b981" }}>{value}</strong>,
    },
    {
      title: "Tổng doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      render: (value) => <strong style={{ color: "#059669" }}>{formatCurrency(value)}</strong>,
    },
    {
      title: "% Đóng góp",
      dataIndex: "contribution",
      key: "contribution",
      width: 130,
      render: (val) => (
        <div>
          <span style={{ fontWeight: 600, fontSize: 12 }}>{val}%</span>
          <div
            style={{
              width: "100%",
              height: 4,
              background: darkMode ? "#1e293b" : "#f1f5f9",
              borderRadius: 2,
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: `${val}%`,
                height: "100%",
                background: "#3b82f6",
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16, color: darkMode ? "#e2e8f0" : "#1e293b" }}>Báo cáo kết quả kinh doanh</h2>

      {/* Period Filter Card */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={6}>
            <Select
              value={periodType}
              style={{ width: "100%" }}
              options={periodOptions}
              onChange={(value) => setPeriodType(value)}
            />
          </Col>

          <Col xs={24} md={10}>
            <DatePicker
              style={{ width: "100%" }}
              value={selectedDate}
              onChange={(value) => setSelectedDate(value || dayjs())}
              picker={periodType === "day" ? "date" : periodType}
              allowClear={false}
              format={
                periodType === "day"
                  ? "DD/MM/YYYY"
                  : periodType === "month"
                  ? "MM/YYYY"
                  : "YYYY"
              }
            />
          </Col>
        </Row>
      </Card>

      {/* Main Tabs Layout */}
      <Tabs
        defaultActiveKey="1"
        type="card"
        items={[
          {
            key: "1",
            label: (
              <span>
                <BarChartOutlined /> Doanh thu & Xu hướng
              </span>
            ),
            children: (
              <div>
                {/* Stats cards */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={8}>
                    <Card style={{ borderRadius: 12 }} hoverable>
                      <Statistic
                        title="Tổng doanh thu thực tế"
                        value={totalRevenue}
                        prefix={<DollarCircleOutlined style={{ color: "#10b981" }} />}
                        formatter={() => formatCurrency(totalRevenue)}
                        valueStyle={{ color: "#10b981", fontWeight: 700 }}
                      />
                    </Card>
                  </Col>

                  <Col xs={24} sm={8}>
                    <Card style={{ borderRadius: 12 }} hoverable>
                      <Statistic
                        title="Số lượt thanh toán"
                        value={paymentCount}
                        prefix={<CreditCardOutlined style={{ color: "#3b82f6" }} />}
                        valueStyle={{ color: "#3b82f6", fontWeight: 700 }}
                      />
                    </Card>
                  </Col>

                  <Col xs={24} sm={8}>
                    <Card style={{ borderRadius: 12 }} hoverable>
                      <Statistic
                        title="Doanh số trung bình/Đơn"
                        value={avgOrderValue}
                        prefix={<DollarCircleOutlined style={{ color: "#8b5cf6" }} />}
                        formatter={() => formatCurrency(avgOrderValue)}
                        valueStyle={{ color: "#8b5cf6", fontWeight: 700 }}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* Trend Chart Card */}
                <Card
                  title={
                    <span style={{ fontWeight: 700 }}>
                      <BarChartOutlined /> Biểu đồ xu hướng doanh thu (
                      {periodType === "day"
                        ? "Theo Giờ"
                        : periodType === "month"
                        ? "Theo Ngày"
                        : "Theo Tháng"}
                      )
                    </span>
                  }
                  style={{ marginBottom: 16, borderRadius: 12 }}
                >
                  <TrendChart data={trendData} periodType={periodType} darkMode={darkMode} />
                </Card>

                {/* Payments Table */}
                <Card title={<span style={{ fontWeight: 700 }}><FileTextOutlined /> Lịch sử thanh toán chi tiết</span>} style={{ borderRadius: 12 }}>
                  <Table
                    rowKey="id"
                    loading={loading}
                    columns={paymentColumns}
                    dataSource={filteredPayments}
                    pagination={{ pageSize: 5 }}
                    size="middle"
                  />
                </Card>
              </div>
            ),
          },
          {
            key: "2",
            label: (
              <span>
                <ShoppingOutlined /> Báo cáo theo mặt hàng
              </span>
            ),
            children: (
              <div>
                {/* Stats cards for products */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={12}>
                    <Card style={{ borderRadius: 12 }} hoverable>
                      <Statistic
                        title="Món ăn bán chạy nhất"
                        value={topProduct ? topProduct.name : "Chưa có"}
                        prefix={<FireOutlined style={{ color: "#ef4444" }} />}
                        valueStyle={{ color: "#ef4444", fontWeight: 700 }}
                        formatter={(val) =>
                          topProduct ? (
                            <span>
                              {val}{" "}
                              <span style={{ fontSize: 14, color: "#8b949e", fontWeight: 400 }}>
                                (Đã bán: {topProduct.quantity} phần)
                              </span>
                            </span>
                          ) : (
                            "Chưa có dữ liệu"
                          )
                        }
                      />
                    </Card>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Card style={{ borderRadius: 12 }} hoverable>
                      <Statistic
                        title="Tổng số lượng món đã bán"
                        value={productSalesReport.totalQuantity}
                        prefix={<ShoppingOutlined style={{ color: "#059669" }} />}
                        valueStyle={{ color: "#059669", fontWeight: 700 }}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* Best Selling Products Chart */}
                <Card
                  title={<span style={{ fontWeight: 700 }}><FireOutlined /> Biểu đồ Top 5 món ăn mang lại doanh thu cao nhất</span>}
                  style={{ marginBottom: 16, borderRadius: 12 }}
                >
                  <ProductBarChart data={productSalesReport.items} darkMode={darkMode} />
                </Card>

                {/* Products sales table */}
                <Card title={<span style={{ fontWeight: 700 }}><FileTextOutlined /> Báo cáo chi tiết sản lượng & Doanh thu món ăn</span>} style={{ borderRadius: 12 }}>
                  <Table
                    rowKey="id"
                    loading={loading}
                    columns={productColumns}
                    dataSource={productSalesReport.items}
                    pagination={{ pageSize: 5 }}
                    size="middle"
                  />
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
