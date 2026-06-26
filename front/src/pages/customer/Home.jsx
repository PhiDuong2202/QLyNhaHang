import { useEffect, useState } from "react";
import { Card, Rate, Button, Modal, Form, Input, message, Layout, Typography, Row, Col, Badge, Select, ConfigProvider } from "antd";
import { StarFilled, EnvironmentOutlined, PhoneOutlined, HeartFilled, FacebookFilled, InstagramOutlined, MailOutlined } from "@ant-design/icons";
import api, { STORAGE_BASE_URL } from "../../services/api";

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Meta } = Card;

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filteredCategoryId, setFilteredCategoryId] = useState("all");

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewingProduct, setReviewingProduct] = useState(null);
  const [form] = Form.useForm();

  const [isViewReviewsOpen, setIsViewReviewsOpen] = useState(false);
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewingProductForView, setReviewingProductForView] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories")
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.log(err);
      message.error("Lỗi khi tải thực đơn");
    } finally {
      setLoading(false);
    }
  };

  const openReview = (product) => {
    setReviewingProduct(product);
    form.resetFields();
    form.setFieldsValue({ rating: 5 });
    setIsReviewOpen(true);
  };

  const submitReview = async (values) => {
    try {
      await api.post("/reviews", {
        product_id: reviewingProduct.id,
        ...values
      });
      message.success("Cảm ơn bạn đã đánh giá món ăn!");
      setIsReviewOpen(false);
      fetchData();
    } catch (err) {
      console.log(err);
      message.error("Đã xảy ra lỗi, vui lòng thử lại sau.");
    }
  };

  const fetchReviews = async (product) => {
    try {
      const res = await api.get(`/products/${product.id}/reviews`);
      setReviewsList(res.data);
      setReviewingProductForView(product);
      setIsViewReviewsOpen(true);
    } catch (err) {
      console.log(err);
      message.error("Lỗi khi tải đánh giá");
    }
  };

  const calculateAverageRating = (reviews) => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const filteredProducts = products.filter(p =>
    filteredCategoryId === "all" ? true : p.category_id === filteredCategoryId
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#e11d48',
          fontFamily: "'Inter', sans-serif",
          borderRadius: 12,
        },
      }}
    >
      <Layout className="customer-layout" style={{ minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <Header style={{
          position: "fixed",
          width: "100%",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 10%",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.05)",
          zIndex: 1000
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <HeartFilled style={{ color: "#e11d48", fontSize: "28px" }} />
            <Title level={3} style={{ margin: 0, color: "#111827", fontWeight: 800, letterSpacing: "-1px" }}>
              FOOD<span style={{ color: "#e11d48" }}>HOLIC</span>
            </Title>
          </div>
        </Header>

        <Content style={{ background: "#f8fafc", paddingTop: "64px" }}>
          <div style={{
            position: "relative",
            background: "linear-gradient(120deg, #0f172a 0%, #1e293b 100%)",
            padding: "100px 20px",
            textAlign: "center",
            color: "white",
            overflow: "hidden"
          }}>
            <div style={{ position: "absolute", top: "-50px", left: "-50px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(225, 29, 72, 0.15)", filter: "blur(40px)" }} />
            <div style={{ position: "absolute", bottom: "-100px", right: "-50px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(56, 189, 248, 0.1)", filter: "blur(50px)" }} />

            <div style={{ position: "relative", zIndex: 1, maxWidth: "800px", margin: "0 auto" }}>
              <Badge count="Mới" style={{ backgroundColor: "#e11d48", padding: "0 12px", height: "28px", lineHeight: "28px", borderRadius: "14px", fontSize: "14px", fontWeight: "bold" }} />
              <Title style={{ color: "white", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, marginBottom: "20px", marginTop: "20px", lineHeight: 1.2, letterSpacing: "-1px" }}>
                Khám Phá Hương Vị <br /> <span style={{ color: "#f43f5e" }}>Tuyệt Hảo</span>
              </Title>
              <Paragraph style={{ color: "#cbd5e1", fontSize: "18px", maxWidth: "600px", margin: "0 auto 40px auto", lineHeight: 1.6 }}>
                Trải nghiệm tinh hoa ẩm thực với thực đơn đa dạng, nguyên liệu tươi sạch và phong cách phục vụ đẳng cấp.
              </Paragraph>
              <Button type="primary" size="large" onClick={() => document.getElementById('menu-section').scrollIntoView({ behavior: 'smooth' })} style={{ height: "50px", padding: "0 40px", fontSize: "18px", fontWeight: 600, borderRadius: "25px", boxShadow: "0 10px 20px rgba(225, 29, 72, 0.3)" }}>
                Xem Thực Đơn
              </Button>
            </div>
          </div>

          <div id="menu-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, flexWrap: "wrap", gap: 20 }}>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 800, color: "#1e293b", letterSpacing: "-1px" }}>Thực Đơn <span style={{ color: "#e11d48" }}>Đặc Trưng</span></Title>
                <Text style={{ color: "#64748b", fontSize: "16px" }}>Chọn món ăn yêu thích của bạn</Text>
              </div>
              <Select
                value={filteredCategoryId}
                onChange={setFilteredCategoryId}
                style={{ width: 250 }}
                size="large"
                dropdownStyle={{ borderRadius: '12px' }}
                options={[
                  { value: "all", label: "🍽️ Tất cả món ăn" },
                  ...categories.map(c => ({ value: c.id, label: c.name }))
                ]}
              />
            </div>

            <Row gutter={[30, 30]}>
              {filteredProducts.map(p => {
                const firstImg = p.images?.[0];
                const avgRating = calculateAverageRating(p.reviews || []);
                const reviewCount = p.reviews?.length || 0;
                const imgUrl = firstImg ? (firstImg.url || ((firstImg.image_url.startsWith("http") || firstImg.image_url.startsWith("data:")) ? firstImg.image_url : `${STORAGE_BASE_URL}/${firstImg.image_url}`)) : null;
                return (
                  <Col xs={24} sm={12} md={12} lg={8} key={p.id}>
                    <Badge.Ribbon text={p.category?.name || "Món ăn"} color="#10b981" style={{ fontSize: "12px", fontWeight: 600, top: 12 }}>
                      <Card
                        hoverable
                        className="product-card"
                        style={{
                          borderRadius: 16,
                          overflow: "hidden",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          border: "none",
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
                          transition: "all 0.3s ease"
                        }}
                        bodyStyle={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px" }}
                        cover={
                          <div className="card-image-wrapper" style={{ height: 220, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                            {imgUrl ? (
                              <img alt={p.name} src={imgUrl} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease", filter: Number(p.status) === 0 ? "grayscale(100%) opacity(60%)" : "none" }} className="card-img" />
                            ) : (
                              <span style={{ color: "#cbd5e1", fontSize: "60px" }}>🍽️</span>
                            )}
                            {Number(p.status) === 0 && (
                              <div style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: "rgba(0, 0, 0, 0.45)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 5,
                                backdropFilter: "blur(1px)"
                              }}>
                                <span style={{
                                  color: "#ff4d4f",
                                  fontSize: "18px",
                                  fontWeight: "bold",
                                  border: "3px solid #ff4d4f",
                                  padding: "6px 16px",
                                  borderRadius: "6px",
                                  transform: "rotate(-12deg)",
                                  background: "rgba(255, 255, 255, 0.95)",
                                  boxShadow: "0 0 10px rgba(255, 77, 79, 0.3)",
                                  letterSpacing: "1.5px"
                                }}>HẾT MÓN</span>
                              </div>
                            )}
                          </div>
                        }
                      >
                        <Meta
                          title={<span style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", whiteSpace: "normal", lineHeight: 1.4 }}>{p.name}</span>}
                          description={
                            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
                                <div style={{ color: "#e11d48", fontWeight: 800, fontSize: "20px" }}>
                                  {Number(p.price).toLocaleString("vi-VN")} <span style={{ fontSize: "14px", fontWeight: 600 }}>VNĐ</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <Rate disabled value={Math.round(calculateAverageRating(p.reviews || []))} style={{ fontSize: 16, color: "#fbbf24" }} />
                                  <span style={{ fontWeight: 600, color: "#64748b", fontSize: "14px" }}>({p.reviews?.length || 0})</span>
                                </div>
                              </div>
                              <div style={{ flex: 1, color: "#64748b", fontSize: "14px", lineHeight: 1.6 }}>
                                {p.description || "Hương vị đậm đà, thơm ngon khó cưỡng. Được chế biến từ những nguyên liệu tươi ngon nhất."}
                              </div>
                            </div>
                          }
                        />
                        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
                          <Button
                            type="primary"
                            onClick={() => fetchReviews(p)}
                            style={{ flex: 1, height: "40px", borderRadius: "8px", fontWeight: 600 }}
                            className="view-reviews-btn"
                          >
                            Xem Đánh Giá
                          </Button>
                          <Button
                            type="dashed"
                            onClick={() => openReview(p)}
                            style={{ flex: 1, height: "40px", borderRadius: "8px", fontWeight: 600, borderColor: "#cbd5e1", color: "#475569" }}
                            icon={<StarFilled style={{ color: "#fbbf24" }} />}
                            className="review-btn"
                          >
                            Đánh giá
                          </Button>
                        </div>
                      </Card>
                    </Badge.Ribbon>
                  </Col>
                );
              })}
            </Row>

            {filteredProducts.length === 0 && !loading && (
              <div style={{ textAlign: "center", padding: "100px 0", background: "white", borderRadius: "16px", marginTop: "20px", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                <span style={{ fontSize: "60px", marginBottom: "20px", display: "inline-block" }}>🔍</span>
                <Title level={4} style={{ color: "#64748b", margin: 0 }}>Chưa có món ăn nào trong danh mục này.</Title>
                <Text style={{ color: "#94a3b8" }}>Vui lòng chọn danh mục khác để khám phá!</Text>
              </div>
            )}
          </div>
        </Content>

        <Footer style={{ background: "#0f172a", color: "#94a3b8", padding: "80px 10% 40px 10%" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 60, justifyContent: "space-between" }}>
            <div style={{ maxWidth: "320px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <HeartFilled style={{ color: "#e11d48", fontSize: "24px" }} />
                <Title level={4} style={{ color: "white", margin: 0, fontWeight: 800 }}>FOODHOLIC</Title>
              </div>
              <Paragraph style={{ color: "#94a3b8", lineHeight: 1.8 }}>
                Ngon như cơm nhà, ấm như tình thân. Chúng tôi cam kết mang đến những bữa ăn tuyệt vời nhất cho bạn và gia đình thông qua nguồn nguyên liệu tươi sạch.
              </Paragraph>
            </div>
            <div>
              <Title level={5} style={{ color: "white", marginBottom: 24, fontWeight: 700 }}>Kết Nối Với Chúng Tôi</Title>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <EnvironmentOutlined style={{ color: "#e11d48", fontSize: "18px", marginTop: "4px" }} />
                  <span>27 Ngõ 143 Xuân Phương<br />Nam Từ Liêm, Hà Nội</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <PhoneOutlined style={{ color: "#e11d48", fontSize: "18px" }} />
                  <span style={{ fontWeight: 600, color: "white", fontSize: "16px" }}>097 790 2004</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <MailOutlined style={{ color: "#e11d48", fontSize: "18px" }} />
                  <span style={{ fontWeight: 600, color: "white", fontSize: "16px" }}>npd22022004@gmail.com</span>
                </div>
              </div>
              <div style={{ marginTop: 24, display: "flex", gap: 16 }}>
                <Button href="https://www.facebook.com/phiduong2202/" target="_blank" type="primary" shape="circle" icon={<FacebookFilled />} style={{ background: "#1877F2", border: "none" }} size="large" title="Facebook" />
                <Button href="https://www.instagram.com/duong22.02/" target="_blank" type="primary" shape="circle" icon={<InstagramOutlined />} style={{ background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)", border: "none" }} size="large" title="Instagram" />
                <Button href="https://zalo.me/0977902004" target="_blank" type="primary" shape="circle" icon={<span style={{ fontSize: '11px', fontWeight: 'bold' }}>Zalo</span>} style={{ background: "#0068FF", border: "none" }} size="large" title="Zalo" />
                <Button href="mailto:npd22022004@gmail.com" type="primary" shape="circle" icon={<MailOutlined />} style={{ background: "#ea4335", border: "none" }} size="large" title="Email" />
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 60, paddingTop: 30, textAlign: "center", fontSize: "14px" }}>
            © {new Date().getFullYear()} Bản quyền thuộc về Nguyễn Phi Dương. Thiết kế với <HeartFilled style={{ color: "#e11d48" }} />
          </div>
        </Footer>

        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: "#fef3c7", padding: "8px", borderRadius: "50%", display: "flex" }}>
                <StarFilled style={{ color: "#f59e0b", fontSize: 20 }} />
              </div>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>Đánh giá: {reviewingProduct?.name}</span>
            </div>
          }
          open={isReviewOpen}
          onCancel={() => setIsReviewOpen(false)}
          footer={null}
          centered
          className="review-modal"
          styles={{
            mask: { backdropFilter: "blur(4px)" },
            content: { borderRadius: "20px", padding: "24px" }
          }}
        >
          <Form form={form} layout="vertical" onFinish={submitReview} style={{ marginTop: 24 }}>
            <Form.Item name="customer_name" label={<span style={{ fontWeight: 600 }}>Tên của bạn</span>} rules={[{ required: true, message: "Vui lòng nhập tên để đánh giá!" }]}>
              <Input placeholder="VD: Nguyễn Văn A" size="large" style={{ borderRadius: "8px" }} />
            </Form.Item>

            <Form.Item name="rating" label={<span style={{ fontWeight: 600 }}>Chấm điểm</span>} rules={[{ required: true }]}>
              <Rate style={{ fontSize: 32, color: "#f43f5e" }} />
            </Form.Item>

            <Form.Item name="comment" label={<span style={{ fontWeight: 600 }}>Nhận xét (Tùy chọn)</span>}>
              <Input.TextArea placeholder="Món ăn rất ngon, trình bày đẹp mắt..." rows={4} style={{ borderRadius: "8px", resize: "none" }} />
            </Form.Item>

            <Form.Item style={{ margin: 0, textAlign: "right", marginTop: 32 }}>
              <Button onClick={() => setIsReviewOpen(false)} size="large" style={{ marginRight: 12, borderRadius: "8px", fontWeight: 600 }}>Hủy</Button>
              <Button type="primary" htmlType="submit" size="large" style={{ borderRadius: "8px", fontWeight: 600, padding: "0 24px", boxShadow: "0 4px 12px rgba(225, 29, 72, 0.4)" }}>
                Gửi Đánh Giá
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: "#fef3c7", padding: "8px", borderRadius: "50%", display: "flex" }}>
                <StarFilled style={{ color: "#f59e0b", fontSize: 20 }} />
              </div>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>Đánh giá: {reviewingProductForView?.name}</span>
            </div>
          }
          open={isViewReviewsOpen}
          onCancel={() => setIsViewReviewsOpen(false)}
          footer={null}
          centered
          className="view-reviews-modal"
          width={600}
          styles={{
            mask: { backdropFilter: "blur(4px)" },
            content: { borderRadius: "20px", padding: "24px" }
          }}
        >
          <div style={{ marginTop: 24 }}>
            {reviewsList.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: "500px", overflowY: "auto" }}>
                {reviewsList.map((review, idx) => (
                  <div key={idx} style={{
                    padding: "16px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    transition: "all 0.3s ease"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "16px" }}>{review.customer_name}</div>
                        <div style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
                          {new Date(review.created_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      <Rate disabled value={review.rating} style={{ fontSize: 16, color: "#fbbf24" }} />
                    </div>
                    {review.comment && (
                      <div style={{ color: "#475569", fontSize: "14px", lineHeight: 1.6, marginTop: "12px", fontStyle: "italic" }}>
                        "{review.comment}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>📝</span>
                <div style={{ fontSize: "16px", fontWeight: 600 }}>Chưa có đánh giá nào</div>
                <div style={{ fontSize: "14px", marginTop: "8px" }}>Hãy là người đầu tiên đánh giá món ăn này!</div>
              </div>
            )}
          </div>
        </Modal>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          
          .product-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          }
          
          .product-card:hover .card-img {
            transform: scale(1.05);
          }
          
          .review-btn:hover {
            border-color: #e11d48 !important;
            color: #e11d48 !important;
            background: #fff1f2 !important;
          }
          
          .ant-select-selector {
            border-radius: 8px !important;
          }
        `}</style>
      </Layout>
    </ConfigProvider>
  );
}
