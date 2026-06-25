import { useEffect, useState, useMemo } from "react";
import {
  Table,
  Button,
  Select,
  InputNumber,
  Modal,
  Space,
  Typography,
  message,
  Card,
  Row,
  Col,
  List,
  Tag,
  Divider,
  Empty,
  Tooltip,
} from "antd";
import {
  SettingOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  CalculatorOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import api from "../../services/api";
import useDarkMode from "../../hooks/useDarkMode";

const { Title, Text } = Typography;
const { Option } = Select;

export default function Recipes() {
  const darkMode = useDarkMode();
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  
  // Local state for the recipe being edited
  const [localRecipeItems, setLocalRecipeItems] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, ingredientsRes] = await Promise.all([
        api.get("/recipes", { skipCache: true }),
        api.get("/ingredients", { skipCache: true }),
      ]);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      setIngredients(Array.isArray(ingredientsRes.data) ? ingredientsRes.data : []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu định lượng:", err);
      const status = err?.response?.status;
      const detail = err?.response?.data?.message || err?.message || "Lỗi không xác định";
      if (status === 401) {
        message.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      } else if (status === 500) {
        message.error(`Lỗi server: ${detail}`);
      } else {
        message.error(`Không tải được dữ liệu định lượng: ${detail}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenRecipeModal = (product) => {
    setSelectedProduct(product);
    
    // Map existing recipes to local state
    const items = (product.recipes || []).map((r) => ({
      key: r.ingredient_id, // Unique key
      ingredient_id: r.ingredient_id,
      name: r.ingredient?.name || `Nguyên liệu ${r.ingredient_id}`,
      unit: r.ingredient?.unit || "",
      amount: Number(r.amount),
      current_stock: Number(r.ingredient?.quantity || 0),
    }));
    
    setLocalRecipeItems(items);
    setIsRecipeModalOpen(true);
  };

  const handleAddIngredientRow = () => {
    // Find first ingredient not already in the local recipe
    const existingIds = localRecipeItems.map((item) => item.ingredient_id);
    const available = ingredients.filter((ing) => !existingIds.includes(ing.id));
    
    if (available.length === 0) {
      message.warning("Đã sử dụng tất cả nguyên liệu có sẵn");
      return;
    }
    
    const target = available[0];
    setLocalRecipeItems((prev) => [
      ...prev,
      {
        key: target.id,
        ingredient_id: target.id,
        name: target.name,
        unit: target.unit,
        amount: 0.1, // default
        current_stock: Number(target.quantity || 0),
      },
    ]);
  };

  const handleUpdateIngredientRow = (key, field, value) => {
    setLocalRecipeItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          if (field === "ingredient_id") {
            const ing = ingredients.find((i) => i.id === value);
            return {
              ...item,
              key: value, // update key
              ingredient_id: value,
              name: ing?.name || "",
              unit: ing?.unit || "",
              current_stock: Number(ing?.quantity || 0),
            };
          } else if (field === "amount") {
            return {
              ...item,
              amount: Math.max(0.001, Number(value || 0.001)),
            };
          }
        }
        return item;
      })
    );
  };

  const handleRemoveIngredientRow = (key) => {
    setLocalRecipeItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleSaveRecipe = async () => {
    if (!selectedProduct) return;
    
    setLoading(true);
    try {
      const payload = {
        ingredients: localRecipeItems.map((item) => ({
          ingredient_id: item.ingredient_id,
          amount: item.amount,
        })),
      };
      
      await api.post(`/recipes/product/${selectedProduct.id}`, payload);
      message.success(`Đã cập nhật định lượng cho món "${selectedProduct.name}"`);
      setIsRecipeModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi lưu định lượng món ăn");
    } finally {
      setLoading(false);
    }
  };

  // Calculate maximum potential servings based on recipe and current stock
  const calculateMaxServings = (recipeItems) => {
    if (!recipeItems || recipeItems.length === 0) return "Không định lượng (Vô hạn)";
    
    let minServings = Infinity;
    let limitingIngredient = "";

    recipeItems.forEach((item) => {
      if (item.amount <= 0) return;
      const servings = Math.floor(item.current_stock / item.amount);
      if (servings < minServings) {
        minServings = servings;
        limitingIngredient = item.name;
      }
    });

    if (minServings === Infinity) return "Không giới hạn";
    
    return {
      servings: minServings,
      limitingIngredient: minServings === 0 ? limitingIngredient : null,
    };
  };

  const maxServingsResult = useMemo(() => {
    return calculateMaxServings(localRecipeItems);
  }, [localRecipeItems]);

  const columns = [
    {
      title: "Món ăn",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Space>
          <ShoppingOutlined style={{ fontSize: 18, color: "#0284c7" }} />
          <Text strong style={{ color: darkMode ? "#f8fafc" : "#0f172a" }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Danh mục",
      dataIndex: ["category", "name"],
      key: "category",
      render: (text) => <Tag color="blue">{text || "Món ăn"}</Tag>,
    },
    {
      title: "Nguyên liệu định lượng",
      key: "recipe",
      render: (_, record) => {
        const recipeList = record.recipes || [];
        if (recipeList.length === 0) {
          return <Text type="secondary" italic>Chưa cấu hình định lượng</Text>;
        }
        return (
          <Space wrap>
            {recipeList.map((r) => (
              <Tag key={r.id} color="purple">
                {r.ingredient?.name}: {Number(r.amount).toLocaleString("vi-VN")} {r.ingredient?.unit}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "Khả năng phục vụ",
      key: "capacity",
      render: (_, record) => {
        const mappedItems = (record.recipes || []).map((r) => ({
          name: r.ingredient?.name || "",
          amount: Number(r.amount),
          current_stock: Number(r.ingredient?.quantity || 0),
        }));
        
        const result = calculateMaxServings(mappedItems);
        
        if (typeof result === "string") {
          return <Tag color="default">{result}</Tag>;
        }
        
        if (result.servings === 0) {
          return (
            <Tooltip title={`Hết nguyên liệu: ${result.limitingIngredient}`}>
              <Tag color="red" style={{ fontWeight: "bold" }}>HẾT HÀNG (0 đĩa)</Tag>
            </Tooltip>
          );
        }
        
        return (
          <Tag color={result.servings < 10 ? "orange" : "green"} style={{ fontWeight: "bold" }}>
            {result.servings} đĩa khả dụng
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<SettingOutlined />}
          onClick={() => handleOpenRecipeModal(record)}
        >
          Cấu hình định lượng
        </Button>
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
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, color: darkMode ? "#f8fafc" : "#0f172a" }}>
            ⚖️ ĐỊNH LƯỢNG MÓN ĂN & CÔNG THỨC
          </Title>
          <Text type="secondary">
            Cấu hình công thức chế biến cho từng món ăn. Hệ thống sẽ tự động trừ kho nguyên liệu khi món ăn được đặt bán
          </Text>
        </div>

        <Table
          dataSource={products}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          style={{ background: "transparent" }}
        />
      </Card>

      {/* Recipe Configuration Modal */}
      <Modal
        title={
          <Title level={3} style={{ margin: 0 }}>
            ⚙️ Định Lượng: {selectedProduct?.name}
          </Title>
        }
        open={isRecipeModalOpen}
        onOk={handleSaveRecipe}
        onCancel={() => setIsRecipeModalOpen(false)}
        okText="Lưu định lượng"
        cancelText="Hủy"
        width={750}
        destroyOnClose
      >
        <div style={{ marginTop: 16 }}>
          {/* Servings calculator summary */}
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 10,
              background: darkMode ? "#1f2937" : "#f0fdf4",
              border: darkMode ? "1px solid #374151" : "1px solid #bbf7d0",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Space size="middle">
              <CalculatorOutlined style={{ fontSize: 24, color: "#16a34a" }} />
              <div>
                <div style={{ fontWeight: "bold", fontSize: 15, color: darkMode ? "#f8fafc" : "#166534" }}>
                  KHẢ NĂNG PHỤC VỤ THỜI ĐIỂM HIỆN TẠI
                </div>
                <div style={{ color: darkMode ? "#cbd5e1" : "#15803d", fontSize: 13 }}>
                  Dựa trên tồn kho thực tế của các nguyên liệu trong công thức
                </div>
              </div>
            </Space>

            <div>
              {typeof maxServingsResult === "string" ? (
                <Tag style={{ fontSize: 16, padding: "6px 12px", fontWeight: "bold" }}>
                  {maxServingsResult}
                </Tag>
              ) : maxServingsResult.servings === 0 ? (
                <Tag color="red" style={{ fontSize: 16, padding: "6px 12px", fontWeight: "bold" }}>
                  ⚠️ 0 đĩa (Thiếu: {maxServingsResult.limitingIngredient})
                </Tag>
              ) : (
                <Tag color={maxServingsResult.servings < 10 ? "orange" : "green"} style={{ fontSize: 18, padding: "6px 12px", fontWeight: "bold" }}>
                  {maxServingsResult.servings} đĩa khả dụng
                </Tag>
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text strong style={{ fontSize: 15 }}>
              Công thức chế biến (Thành phần nguyên liệu):
            </Text>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddIngredientRow}
            >
              Thêm nguyên liệu
            </Button>
          </div>

          {localRecipeItems.length === 0 ? (
            <div style={{ padding: "40px 0" }}>
              <Empty description="Chưa cấu hình thành phần công thức. Món ăn này hiện được coi là không giới hạn tồn kho." />
            </div>
          ) : (
            <List
              dataSource={localRecipeItems}
              renderItem={(item) => {
                // Get available ingredients for dropdown
                const selectedIds = localRecipeItems
                  .filter((i) => i.key !== item.key)
                  .map((i) => i.ingredient_id);
                
                const selectOptions = ingredients.filter(
                  (ing) => !selectedIds.includes(ing.id)
                );

                return (
                  <List.Item
                    actions={[
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        type="text"
                        onClick={() => handleRemoveIngredientRow(item.key)}
                      />,
                    ]}
                  >
                    <Row gutter={16} style={{ width: "100%", alignItems: "center" }}>
                      <Col span={12}>
                        <Select
                          value={item.ingredient_id}
                          onChange={(val) => handleUpdateIngredientRow(item.key, "ingredient_id", val)}
                          style={{ width: "100%" }}
                        >
                          {selectOptions.map((ing) => (
                            <Option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </Option>
                          ))}
                        </Select>
                      </Col>
                      <Col span={8}>
                        <Space>
                          <InputNumber
                            min={0.001}
                            value={item.amount}
                            onChange={(val) => handleUpdateIngredientRow(item.key, "amount", val)}
                            style={{ width: 120 }}
                          />
                          <Text type="secondary">{item.unit}</Text>
                        </Space>
                      </Col>
                      <Col span={4} style={{ textAlign: "right" }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Kho: {item.current_stock.toLocaleString("vi-VN")}
                        </Text>
                      </Col>
                    </Row>
                  </List.Item>
                );
              }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
