import { useEffect, useMemo, useState } from "react";
import { Card, Col, Row, Select, DatePicker, Statistic, Table, Tag } from "antd";
import { DollarCircleOutlined, CreditCardOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";

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

export default function Revenue() {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [periodType, setPeriodType] = useState("day");
  const [selectedDate, setSelectedDate] = useState(dayjs());

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await api.get("/payments");
        setPayments(getList(res?.data));
      } catch (err) {
        console.log(err);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const isMatchPeriod = (createdAt) => {
    if (!createdAt || !selectedDate) return false;

    const paymentDate = dayjs(createdAt);
    if (!paymentDate.isValid()) return false;

    if (periodType === "day") {
      return paymentDate.isSame(selectedDate, "day");
    }

    if (periodType === "month") {
      return paymentDate.isSame(selectedDate, "month");
    }

    return paymentDate.isSame(selectedDate, "year");
  };

  const filteredPayments = useMemo(
    () => payments.filter((p) => isMatchPeriod(p.created_at)),
    [payments, periodType, selectedDate]
  );

  const totalRevenue = useMemo(
    () => filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [filteredPayments]
  );

  const paymentCount = filteredPayments.length;

  const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  const columns = [
    {
      title: "Mã thanh toán",
      dataIndex: "id",
      key: "id",
      width: 140,
    },
    {
      title: "Mã đơn hàng",
      dataIndex: "order_id",
      key: "order_id",
      width: 120,
      render: (value) => value || "-",
    },
    {
      title: "Phương thức",
      dataIndex: "method",
      key: "method",
      width: 160,
      render: (value) => <Tag color="blue">{value || "cash"}</Tag>,
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (value) => formatCurrency(Number(value || 0)),
    },
    {
      title: "Ngày thanh toán",
      dataIndex: "created_at",
      key: "created_at",
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-"),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Báo cáo doanh thu</h2>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Select
              value={periodType}
              style={{ width: "100%" }}
              options={periodOptions}
              onChange={(value) => setPeriodType(value)}
            />
          </Col>

          <Col xs={24} md={8}>
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

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card>
            <Statistic
              title="Tong doanh thu"
              value={totalRevenue}
              prefix={<DollarCircleOutlined />}
              formatter={() => formatCurrency(totalRevenue)}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card>
            <Statistic
              title="So giao dich"
              value={paymentCount}
              prefix={<CreditCardOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredPayments}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
