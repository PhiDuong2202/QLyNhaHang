import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Col,
  Empty,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
  message,
  Spin,
  Card,
  Divider,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import api from "../../services/api";
import useDarkMode from "../../hooks/useDarkMode";
import TableSelection from "../../components/TableSelection";

const { Text } = Typography;

const formatMoney = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;

export default function OrderDesk() {
  const darkMode = useDarkMode();
  const styles = useMemo(() => createStyles(darkMode), [darkMode]);

  const cachedProducts = useMemo(() => api.readCachedData({ url: "/products" }) || [], []);
  const cachedTables = useMemo(() => api.readCachedData({ url: "/tables" }) || [], []);
  const cachedCategories = useMemo(() => api.readCachedData({ url: "/categories" }) || [], []);
  const cachedCustomers = useMemo(() => api.readCachedData({ url: "/customers" }) || [], []);

  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [products, setProducts] = useState(cachedProducts);
  const [tables, setTables] = useState(cachedTables);
  const [categories, setCategories] = useState(cachedCategories);
  const [customers, setCustomers] = useState(cachedCustomers);
  const [orders, setOrders] = useState([]);

  const [selectedTable, setSelectedTable] = useState();
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [orderType, setOrderType] = useState("dine_in");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [existingCustomerId, setExistingCustomerId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [cart, setCart] = useState([]);

  const loadData = async ({ silent = false } = {}) => {
    try {
      const [productsRes, tablesRes, categoriesRes, customersRes, ordersRes] = await Promise.all([
        api.get("/products"),
        api.get("/tables"),
        api.get("/categories"),
        api.get("/customers"),
        api.get("/orders"),
      ]);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      setTables(Array.isArray(tablesRes.data) ? tablesRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      setCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
      
      const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      console.log("Loaded orders from API:", ordersData);
      setOrders(ordersData);
    } catch (err) {
      console.log(err);
      if (!silent) {
        message.error("Không tải được dữ liệu đặt đơn");
      }
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadData({ silent: products.length > 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (orderType === "take_away") {
      setSelectedTable(undefined);
    }
  }, [orderType]);

  // Load order items when table selection changes
  useEffect(() => {
    if (selectedTable && orderType === "dine_in") {
      // Find existing order for this table with pending/processing status
      console.log("All orders:", orders);
      console.log("Looking for table:", selectedTable, "type:", typeof selectedTable);
      
      const existingOrder = orders.find(
        (o) => {
          const tableMatch = Number(o.table_id) === Number(selectedTable);
          const statusMatch = o.status && (
            o.status === "pending" || 
            o.status === "processing" || 
            o.status === "Đang chờ" ||
            o.status === "Đang làm"
          );
          console.log(`Order ${o.id}: table_id=${o.table_id} (${typeof o.table_id}), status='${o.status}', tableMatch=${tableMatch}, statusMatch=${statusMatch}`);
          return tableMatch && statusMatch;
        }
      );

      console.log("selectedTable:", selectedTable, "existingOrder found:", existingOrder?.id || "none");

      if (existingOrder && existingOrder.orderItems) {
        // Load order items into cart
        console.log("Loading order items:", existingOrder.orderItems);
        const items = existingOrder.orderItems.map((item) => ({
          key: item.product_id,
          product_id: item.product_id,
          name: item.product?.name || `Product ${item.product_id}`,
          price: Number(item.price || 0),
          quantity: item.quantity,
          order_item_id: item.id, // Track original order item for update
        }));
        setCart(items);
        setCurrentOrderId(existingOrder.id);

        // Load customer info if exists
        if (existingOrder.customer) {
          console.log("Loading customer:", existingOrder.customer);
          setCustomerName(existingOrder.customer.name || "");
          setCustomerPhone(existingOrder.customer.phone || "");
          setExistingCustomerId(existingOrder.customer.id);
        }
      } else {
        // New order - clear everything
        console.log("No existing order found, clearing cart");
        setCart([]);
        setCurrentOrderId(null);
        setCustomerName("");
        setCustomerPhone("");
        setExistingCustomerId(null);
      }
    } else if (!selectedTable && orderType === "dine_in") {

      setCart([]);
      setCurrentOrderId(null);
      setCustomerName("");
      setCustomerPhone("");
      setExistingCustomerId(null);
    }
  }, [selectedTable, orderType, orders]);

  const handlePhoneChange = (value) => {
    const phone = value.trim();
    setCustomerPhone(phone);

    if (!phone) {
      setExistingCustomerId(null);
      setCustomerName("");
      return;
    }

    const found = customers.find(
      (customer) => customer.phone && customer.phone.trim() === phone
    );

    if (found) {
      setExistingCustomerId(found.id);
      setCustomerName(found.name || "");
    } else {
      setExistingCustomerId(null);
      if (!customerName) {
        setCustomerName("");
      }
    }
  };

  const filteredProducts = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return products.filter((p) => {
      const matchKeyword = !q || p.name?.toLowerCase().includes(q);
      const matchCategory =
        selectedCategory === "all" || Number(p.category_id) === Number(selectedCategory);
      return matchKeyword && matchCategory;
    });
  }, [products, keyword, selectedCategory]);

  const addToCart = (product) => {
    setCart((prev) => {
      const found = prev.find((item) => item.product_id === product.id);
      if (found) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          key: product.id,
          product_id: product.id,
          name: product.name,
          price: Number(product.price || 0),
          quantity: 1,
        },
      ];
    });
  };

  const updateQty = (productId, quantity) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: Math.max(1, Number(quantity || 1)) }
          : item
      )
    );
  };

  const removeItem = (productId) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const submitOrder = async () => {
    const requiresTable = orderType !== "take_away";

    if (requiresTable && !selectedTable) {
      message.warning("Vui lòng chọn bàn");
      return;
    }

    if (cart.length === 0) {
      message.warning("Vui lòng chọn món trước khi tạo đơn");
      return;
    }

    setLoading(true);
    try {
      // If updating existing order
      if (currentOrderId) {
        // Get original order items
        const originalOrder = orders.find((o) => o.id === currentOrderId);
        const originalItems = originalOrder?.orderItems || [];

        // Items to delete: exist in original but not in current cart
        const itemIdsToKeep = cart
          .filter((item) => item.order_item_id)
          .map((item) => item.order_item_id);

        const itemsToDelete = originalItems.filter(
          (item) => !itemIdsToKeep.includes(item.id)
        );

        await Promise.all(
          itemsToDelete.map((item) =>
            api.delete(`/order-items/${item.id}`)
          )
        );

        await Promise.all(
          cart.map((item) => {
            if (item.order_item_id) {
              return api.put(`/order-items/${item.order_item_id}`, {
                quantity: item.quantity,
              });
            } else {
              return api.post("/order-items", {
                order_id: currentOrderId,
                product_id: item.product_id,
                quantity: item.quantity,
              });
            }
          })
        );

        const customerId = existingCustomerId || (customerName.trim() || customerPhone.trim() ? 
          (await api.post("/customers", {
            name: customerName.trim() || null,
            phone: customerPhone.trim() || null,
          })).data?.id : null);

        const newTotal = cart.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        await api.put(`/orders/${currentOrderId}`, {
          total_price: newTotal,
          customer_id: customerId,
        });

        message.success("Cập nhật đơn hàng thành công");
        
        setCart([]);
        loadData({ silent: true });
      } else {
        let customerId = null;
        if (customerName.trim()) {
          const customerRes = await api.post("/customers", {
            name: customerName.trim(),
            phone: customerPhone.trim() || null,
          });
          customerId = customerRes.data?.id ?? null;
        }

        if (!existingCustomerId && customerPhone.trim() && !customerName.trim()) {
          message.warning("Vui lòng nhập tên khách hàng mới nếu số điện thoại chưa có trong hệ thống");
          setLoading(false);
          return;
        }

        if (!existingCustomerId && customerPhone.trim()) {
          const customersRes = await api.post("/customers", {
            name: customerName.trim() || null,
            phone: customerPhone.trim(),
          });
          customerId = customersRes.data?.id ?? null;
        } else if (existingCustomerId) {
          customerId = existingCustomerId;
        } else if (customerName.trim()) {
          const customersRes = await api.post("/customers", {
            name: customerName.trim(),
            phone: customerPhone.trim() || null,
          });
          customerId = customersRes.data?.id ?? null;
        }

        const orderPayload = {
          order_type: orderType,
          total_price: total,
          status: "pending",
          ...(customerId ? { customer_id: customerId } : {}),
          ...(requiresTable ? { table_id: selectedTable } : {}),
        };

        const orderRes = await api.post("/orders", orderPayload);

        const orderId = orderRes.data?.id;
        
        await Promise.all(
          cart.map((item) =>
            api.post("/order-items", {
              order_id: orderId,
              product_id: item.product_id,
              quantity: item.quantity,
            })
          )
        );

        message.success("Tạo đơn thành công");
        
        setCurrentOrderId(orderId);
        setCart([]);
        
        loadData({ silent: true });
      }

    } catch (err) {
      console.log(err);
      const msg = err?.response?.data?.message;
      message.error(msg || "Không tạo được đơn");
    } finally {
      setLoading(false);
    }
  };

  const requiresTable = orderType !== "take_away";

  if (requiresTable && !selectedTable) {
    return (
      <div style={styles.page}>
        <div style={styles.tableSelectionContainer}>
          <TableSelection
            tables={tables}
            selectedTable={selectedTable}
            onSelectTable={setSelectedTable}
            loading={isFetching}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {selectedTable && requiresTable && (
        <div style={styles.breadcrumb}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              setSelectedTable(undefined);
            }}
          >
            Chọn bàn khác
          </Button>
          <span style={{ color: "inherit", marginLeft: 8 }}>
            Bàn: <strong>{tables.find((t) => t.id === selectedTable)?.name || `Bàn ${selectedTable}`}</strong>
          </span>
        </div>
      )}
      <Row gutter={12} style={{ margin: 0 }}>
        <Col xs={24} lg={14} style={{ paddingLeft: 0 }}>
          <div style={styles.leftPane}>
            <div style={styles.toolbar}>
              <div style={styles.toolbarTitle}>Thực đơn</div>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm món..."
                prefix={<SearchOutlined />}
                style={styles.searchInput}
              />
            </div>

            <div style={styles.categoryRow}>
              <Button
                type={selectedCategory === "all" ? "primary" : "default"}
                onClick={() => setSelectedCategory("all")}
              >
                Tất cả
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  type={Number(selectedCategory) === cat.id ? "primary" : "default"}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            <div style={styles.productGrid}>
              {filteredProducts.map((p) => {
                const image = p.images?.[0];
                const imageUrl = image
                  ? image.url || `http://localhost:8000/storage/${image.image_url}`
                  : null;

                return (
                  <div key={p.id} style={styles.productCard}>
                    <div style={styles.imageWrap}>
                      {imageUrl ? (
                        <img src={imageUrl} alt={p.name} style={styles.productImage} />
                      ) : (
                        <div style={styles.noImage}>Không ảnh</div>
                      )}
                    </div>
                    <div style={styles.productName}>{p.name}</div>
                    <div style={styles.productPrice}>{formatMoney(p.price)}</div>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      block
                      onClick={() => addToCart(p)}
                    >
                      Thêm
                    </Button>
                  </div>
                );
              })}

              {isFetching && (
                <div style={{ width: "100%", textAlign: "center", padding: "40px 0", gridColumn: "1 / -1" }}>
                  <Spin size="large" tip="Đang tải dữ liệu..." />
                </div>
              )}

              {!isFetching && filteredProducts.length === 0 && (
                <div style={{ width: "100%", gridColumn: "1 / -1" }}>
                  <Empty description="Không có món phù hợp" />
                </div>
              )}
            </div>
          </div>
        </Col>

        <Col xs={24} lg={10} style={{ paddingRight: 0 }}>
          <div style={styles.rightPane}>
            <div style={styles.billHeader}>
              <Space>
                <ShoppingCartOutlined />
                <Text strong style={styles.billTitle}>Hóa đơn</Text>
                <Badge count={cart.length} showZero />
              </Space>
            </div>

            <div style={styles.orderMeta}>
              <Select
                value={orderType}
                onChange={setOrderType}
                options={[
                  { value: "dine_in", label: "Tại chỗ" },
                  { value: "take_away", label: "Mang về" },
                  { value: "preorder", label: "Khách đặt" },
                ]}
              />
              {requiresTable && selectedTable ? (
                <div style={styles.fixedTableInfo}>
                  <strong>Bàn hiện tại:</strong>{" "}
                  {tables.find((t) => t.id === selectedTable)?.name || `Bàn ${selectedTable}`}
                </div>
              ) : null}
              <Input
                value={customerPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="SĐT khách"
              />
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Tên khách"
                disabled={!!existingCustomerId}
              />
              {!!existingCustomerId && (
                <div style={styles.customerNote}>
                  Khách hàng: <strong>{customerName}</strong>
                </div>
              )}
            </div>

            <div style={styles.cartList}>
              {cart.length === 0 && <Empty description="Chưa có món" />}

              {cart.map((item, index) => (
                <div key={item.product_id} style={styles.cartRow}>
                  <div style={styles.cartIndex}>{index + 1}</div>
                  <div style={styles.cartInfo}>
                    <div style={styles.cartName}>{item.name}</div>
                    <div style={styles.cartLinePrice}>{formatMoney(item.price)}</div>
                  </div>
                  <InputNumber
                    min={1}
                    value={item.quantity}
                    onChange={(val) => updateQty(item.product_id, val)}
                  />
                  <div style={styles.cartTotal}>{formatMoney(item.price * item.quantity)}</div>
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => removeItem(item.product_id)}
                  />
                </div>
              ))}
            </div>

            <div style={styles.billFooter}>
              <div style={styles.totalBox}>
                <span>Tổng tiền</span>
                <strong>{formatMoney(total)}</strong>
              </div>
              <Button
                type="primary"
                size="large"
                loading={loading}
                onClick={submitOrder}
                block
              >
                {currentOrderId ? "Cập nhật đơn" : "Tạo đơn"}
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}

function createStyles(darkMode) {
  return {
    page: {
      minHeight: "calc(100vh - 180px)",
    },
    tableSelectionContainer: {
      padding: 12,
      minHeight: "calc(100vh - 180px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    breadcrumb: {
      marginBottom: 12,
      padding: 12,
      borderRadius: 8,
      background: darkMode ? "#0b1220" : "#f0f7ff",
      border: darkMode ? "1px solid #1f2a44" : "1px solid #b6e3ff",
      color: darkMode ? "#e2e8f0" : "#0f172a",
      display: "flex",
      alignItems: "center",
      gap: 12,
    },
    leftPane: {
      borderRadius: 10,
      background: darkMode ? "#0f172a" : "#f8fafc",
      border: darkMode ? "1px solid #1f2a44" : "1px solid #dbe4f0",
      padding: 12,
      minHeight: "calc(100vh - 180px)",
    },
    rightPane: {
      borderRadius: 10,
      background: darkMode ? "#111827" : "#fff",
      border: darkMode ? "1px solid #25314d" : "1px solid #dbe4f0",
      minHeight: "calc(100vh - 180px)",
      display: "flex",
      flexDirection: "column",
    },
    toolbar: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      marginBottom: 10,
    },
    toolbarTitle: {
      minWidth: 92,
      fontWeight: 700,
      color: darkMode ? "#e2e8f0" : "#0f172a",
    },
    searchInput: {
      flex: 1,
    },
    categoryRow: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: 12,
    },
    productGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
      gap: 10,
      maxHeight: "calc(100vh - 285px)",
      overflowY: "auto",
      paddingRight: 4,
    },
    productCard: {
      border: darkMode ? "1px solid #25314d" : "1px solid #dbe4f0",
      borderRadius: 10,
      background: darkMode ? "#0b1220" : "#fff",
      padding: 8,
      display: "flex",
      flexDirection: "column",
      gap: 8,
    },
    imageWrap: {
      height: 90,
      borderRadius: 8,
      overflow: "hidden",
      background: darkMode ? "#1e293b" : "#e2e8f0",
    },
    productImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    noImage: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      color: darkMode ? "#94a3b8" : "#64748b",
      fontSize: 12,
    },
    productName: {
      fontWeight: 600,
      fontSize: 13,
      lineHeight: 1.4,
      minHeight: 36,
      color: darkMode ? "#e5e7eb" : "#111827",
    },
    productPrice: {
      color: darkMode ? "#38bdf8" : "#0284c7",
      fontWeight: 700,
    },
    billHeader: {
      padding: "12px 14px",
      borderBottom: darkMode ? "1px solid #25314d" : "1px solid #e2e8f0",
      background: darkMode ? "#0b1220" : "#f8fafc",
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
    },
    billTitle: {
      color: darkMode ? "#e2e8f0" : "#0f172a",
    },
    orderMeta: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 8,
      padding: 12,
      borderBottom: darkMode ? "1px solid #25314d" : "1px solid #e2e8f0",
    },
    fixedTableInfo: {
      padding: "10px 12px",
      borderRadius: 10,
      background: darkMode ? "#0f172a" : "#f8fafc",
      border: darkMode ? "1px solid #25314d" : "1px solid #e2e8f0",
      color: darkMode ? "#e2e8f0" : "#0f172a",
      fontWeight: 600,
    },
    customerNote: {
      padding: "10px 12px",
      borderRadius: 10,
      background: darkMode ? "#111827" : "#f1f5f9",
      color: darkMode ? "#60a5fa" : "#2563eb",
      border: darkMode ? "1px solid #1e293b" : "1px solid #dbe4ef",
      fontSize: 13,
    },
    cartList: {
      flex: 1,
      overflowY: "auto",
      padding: 12,
    },
    cartRow: {
      display: "grid",
      gridTemplateColumns: "24px 1fr 86px 110px 28px",
      gap: 8,
      alignItems: "center",
      borderBottom: darkMode ? "1px solid #243049" : "1px solid #eef2f7",
      padding: "8px 0",
    },
    cartIndex: {
      color: darkMode ? "#94a3b8" : "#64748b",
      fontWeight: 600,
      fontSize: 12,
    },
    cartInfo: {
      minWidth: 0,
    },
    cartName: {
      fontWeight: 600,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      color: darkMode ? "#e2e8f0" : "#0f172a",
    },
    cartLinePrice: {
      fontSize: 12,
      color: darkMode ? "#94a3b8" : "#64748b",
    },
    cartTotal: {
      textAlign: "right",
      fontWeight: 700,
      color: darkMode ? "#e2e8f0" : "#0f172a",
    },
    billFooter: {
      borderTop: darkMode ? "1px solid #25314d" : "1px solid #e2e8f0",
      padding: 12,
      display: "flex",
      flexDirection: "column",
      gap: 10,
    },
    totalBox: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontSize: 16,
      color: darkMode ? "#e2e8f0" : "#0f172a",
    },
  };
}
