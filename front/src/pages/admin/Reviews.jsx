import { useEffect, useMemo, useState } from "react";
import { Card, Col, Input, Rate, Row, Select, Space, Statistic, Table, Tag, Typography } from "antd";
import { MessageOutlined, StarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";

const { Title } = Typography;

const getList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default function Reviews() {
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const res = await api.get("/reviews");
        setReviews(getList(res?.data));
      } catch (err) {
        console.log(err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return reviews.filter((r) => {
      const matchesKeyword =
        !q ||
        (r.customer_name || "").toLowerCase().includes(q) ||
        (r.comment || "").toLowerCase().includes(q) ||
        (r.product?.name || "").toLowerCase().includes(q);

      const matchesRating =
        ratingFilter === "all" || Number(r.rating) === Number(ratingFilter);

      return matchesKeyword && matchesRating;
    });
  }, [reviews, keyword, ratingFilter]);

  const avgRating = useMemo(() => {
    if (!filteredReviews.length) return 0;
    const total = filteredReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
    return total / filteredReviews.length;
  }, [filteredReviews]);

  const columns = [
    {
      title: "STT",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Khách hàng",
      dataIndex: "customer_name",
      key: "customer_name",
      render: (value) => value || "-",
    },
    {
      title: "Sản phẩm",
      dataIndex: ["product", "name"],
      key: "product",
      render: (value) => value || "-",
    },
    {
      title: "Đánh giá",
      dataIndex: "rating",
      key: "rating",
      width: 180,
      render: (value) => <Rate disabled value={Number(value || 0)} />,
    },
    {
      title: "Nội dung",
      dataIndex: "comment",
      key: "comment",
      render: (value) => value || "-",
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "-"),
    },
  ];

  return (
    <div>
      <Title level={3}>Đánh giá khách hàng</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card>
            <Statistic
              title="Tổng đánh giá"
              value={filteredReviews.length}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <Statistic
              title="Điểm trung bình"
              value={avgRating}
              precision={1}
              prefix={<StarOutlined />}
              suffix={<Tag color="gold">/ 5</Tag>}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Tìm theo tên khách, sản phẩm, nội dung"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 320 }}
            allowClear
          />

          <Select
            value={ratingFilter}
            onChange={setRatingFilter}
            style={{ width: 180 }}
            options={[
              { value: "all", label: "Tất cả số sao" },
              { value: 5, label: "5 sao" },
              { value: 4, label: "4 sao" },
              { value: 3, label: "3 sao" },
              { value: 2, label: "2 sao" },
              { value: 1, label: "1 sao" },
            ]}
          />
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredReviews}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
