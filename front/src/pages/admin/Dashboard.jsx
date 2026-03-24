import { useEffect, useState } from "react";
import { Card, Row, Col, Statistic } from "antd";
import {
  DollarCircleOutlined,
  ShopOutlined,
  AppstoreOutlined,
  TagsOutlined,
  OrderedListOutlined,
  StarOutlined,
  TableOutlined,
} from "@ant-design/icons";
import api from "../../services/api";

export default function Dashboard() {
  const [summary, setSummary] = useState({
    tables: 0,
    revenue: 0,
    products: 0,
    categories: 0,
    orders: 0,
    reviews: 0,
    avgRating: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          ordersResult,
          paymentsResult,
          productsResult,
          categoriesResult,
          tablesResult,
          reviewsResult,
        ] = await Promise.allSettled([
          api.get("/orders"),
          api.get("/payments"),
          api.get("/products"),
          api.get("/categories"),
          api.get("/tables"),
          api.get("/reviews"),
        ]);

        const getList = (result) => {
          if (result.status !== "fulfilled") return [];
          const payload = result.value?.data;
          if (Array.isArray(payload)) return payload;
          if (Array.isArray(payload?.data)) return payload.data;
          return [];
        };

        const orders = getList(ordersResult);
        const payments = getList(paymentsResult);
        const products = getList(productsResult);
        const categories = getList(categoriesResult);
        const tables = getList(tablesResult);
        const reviews = getList(reviewsResult);

        const totalOrders = orders.length;
        const totalRevenue = payments.reduce(
          (sum, p) => sum + Number(p.amount || 0),
          0
        );
        const totalProducts = products.length;
        const totalCategories = categories.length;
        const totalTables = tables.length;
        const totalReviews = reviews.length;
        const avgRating =
          totalReviews > 0
            ? reviews.reduce(
                (sum, r) => sum + Number(r.rating || 0),
                0
              ) / totalReviews
            : 0;

        setSummary({
          tables: totalTables,
          revenue: totalRevenue,
          products: totalProducts,
          categories: totalCategories,
          orders: totalOrders,
          reviews: totalReviews,
          avgRating,
        });
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Tổng quan nhà hàng</h2>

      <Row gutter={[16, 16]}>
        {/* Tổng đơn hàng */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Tổng đơn hàng"
              value={summary.orders}
              prefix={<OrderedListOutlined />}
            />
          </Card>
        </Col>

        {/* Tổng doanh thu */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={summary.revenue}
              prefix={<DollarCircleOutlined />}
              formatter={() => formatCurrency(summary.revenue)}
            />
          </Card>
        </Col>

        {/* Số bàn */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Số bàn"
              value={summary.tables}
              prefix={<TableOutlined />}
            />
          </Card>
        </Col>

        {/* Số món ăn */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Số món ăn"
              value={summary.products}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>

        {/* Số danh mục */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Số danh mục"
              value={summary.categories}
              prefix={<TagsOutlined />}
            />
          </Card>
        </Col>

        {/* Số đánh giá */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Số đánh giá"
              value={summary.reviews}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>

        {/* Số sao trung bình */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Số sao trung bình"
              value={summary.avgRating}
              precision={1}
              prefix={<StarOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
