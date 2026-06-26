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
  notification,
  Modal,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  ArrowLeftOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import api, { STORAGE_BASE_URL } from "../../services/api";
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
  const [activeOrderToPrint, setActiveOrderToPrint] = useState(null);

  const [selectedTable, setSelectedTable] = useState();
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [orderType, setOrderType] = useState("dine_in");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [existingCustomerId, setExistingCustomerId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [cart, setCart] = useState([]);

  // Load all initial data (static categories and customers, plus initial sync)
  const loadData = async ({ silent = false } = {}) => {
    if (!silent) setIsFetching(true);
    try {
      const [syncRes, categoriesRes, customersRes] = await Promise.all([
        api.get("/sync"),
        api.get("/categories"),
        api.get("/customers"),
      ]);
      
      const fetchedProducts = Array.isArray(syncRes.data?.products) ? syncRes.data.products : [];
      const fetchedTables = Array.isArray(syncRes.data?.tables) ? syncRes.data.tables : [];
      const fetchedOrders = Array.isArray(syncRes.data?.orders) ? syncRes.data.orders : [];

      setProducts(fetchedProducts);
      setTables(fetchedTables);
      setOrders(fetchedOrders);
      
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      setCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
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

  // Optimized Coordinated Polling for tables, active orders, and products stock status
  useEffect(() => {
    const pollSync = async () => {
      try {
        const res = await api.get("/sync");
        const newProducts = Array.isArray(res.data?.products) ? res.data.products : [];
        const newTables = Array.isArray(res.data?.tables) ? res.data.tables : [];
        const newOrders = Array.isArray(res.data?.orders) ? res.data.orders : [];
        
        setProducts((prevProducts) => {
          if (prevProducts && prevProducts.length > 0) {
            const outOfStockProducts = [];
            newProducts.forEach((newP) => {
              const oldP = prevProducts.find((p) => p.id === newP.id);
              if (oldP) {
                const oldStatus = Number(oldP.status);
                const newStatus = Number(newP.status);
                if (oldStatus !== 0 && newStatus === 0) {
                  outOfStockProducts.push(newP);
                }
              }
            });
            
            if (outOfStockProducts.length > 0) {
              setTimeout(() => {
                outOfStockProducts.forEach((p) => {
                  notification.warning({
                    message: "Thông báo hết món",
                    description: `Món "${p.name}" vừa hết nguyên liệu! Hệ thống đã tự động khóa món.`,
                    placement: "topRight",
                    duration: 5,
                  });
                });
              }, 0);
            }
          }
          return newProducts;
        });

        setTables(newTables);
        setOrders(newOrders);
      } catch (err) {
        console.error("Lỗi đồng bộ dữ liệu OrderDesk:", err);
      }
    };

    const pollInterval = setInterval(pollSync, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    if (orderType === "take_away") {
      setSelectedTable(undefined);
    }
  }, [orderType]);

  // Calculate capacity based on recipe ingredients stock
  const getProductCapacity = (product) => {
    if (!product.recipes || product.recipes.length === 0) return null; // Unlimited
    
    let minServings = Infinity;
    product.recipes.forEach((r) => {
      const amount = Number(r.amount);
      const stock = Number(r.ingredient?.quantity ?? 0);
      if (amount <= 0) return;
      const servings = Math.floor(stock / amount);
      if (servings < minServings) {
        minServings = servings;
      }
    });
    
    return minServings === Infinity ? null : minServings;
  };

  // Load order items when table selection changes
  useEffect(() => {
    if (selectedTable && orderType === "dine_in") {
      console.log("All orders:", orders);
      console.log("Looking for table:", selectedTable, "type:", typeof selectedTable);
      
      const existingOrder = orders.find(
        (o) => {
          const tableMatch = Number(o.table_id) === Number(selectedTable);
          // Allow any order that is NOT completed or cancelled to load
          const statusMatch = o.status && o.status !== "completed" && o.status !== "cancelled";
          return tableMatch && statusMatch;
        }
      );

      console.log("selectedTable:", selectedTable, "existingOrder found:", existingOrder?.id || "none");

      const orderItems = existingOrder?.order_items || existingOrder?.orderItems;

      if (existingOrder && orderItems) {
        console.log("Loading order items:", orderItems);
        const items = orderItems.map((item) => ({
          key: item.product_id,
          product_id: item.product_id,
          name: item.product?.name || `Product ${item.product_id}`,
          price: Number(item.price || 0),
          quantity: item.quantity,
          order_item_id: item.id, // Track original order item for update
          notes: item.notes || "", // Load notes!
        }));
        setCart(items);
        setCurrentOrderId(existingOrder.id);

        if (existingOrder.customer) {
          console.log("Loading customer:", existingOrder.customer);
          setCustomerName(existingOrder.customer.name || "");
          setCustomerPhone(existingOrder.customer.phone || "");
          setExistingCustomerId(existingOrder.customer.id);
        }
      } else {
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
    // Only run this effect when table selection changes, NOT when orders update in background
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable, orderType]);

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
    const capacity = getProductCapacity(product);

    setCart((prev) => {
      const found = prev.find((item) => item.product_id === product.id);
      if (found) {
        if (capacity !== null && found.quantity >= capacity) {
          message.warning(`Không thể thêm! Món "${product.name}" chỉ còn lại tối đa ${capacity} phần khả dụng dựa trên kho nguyên liệu.`);
          return prev;
        }
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      if (capacity !== null && capacity <= 0) {
        message.error(`Món "${product.name}" đã hết nguyên liệu chế biến!`);
        return prev;
      }

      return [
        ...prev,
        {
          key: product.id,
          product_id: product.id,
          name: product.name,
          price: Number(product.price || 0),
          quantity: 1,
          notes: "", // default empty notes
        },
      ];
    });
  };

  const updateItemNotes = (productId, notes) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, notes: notes }
          : item
      )
    );
  };

  const removeItem = (productId) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const updateQty = (productId, quantity) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const capacity = getProductCapacity(product);
    const targetQty = Number(quantity || 0);

    if (targetQty === 0) {
      Modal.confirm({
        title: "⚠️ Xác nhận xoá món ăn",
        content: `Bạn có chắc chắn muốn xoá món "${product.name}" khỏi danh sách gọi món không?`,
        okText: "Đồng ý xoá",
        okType: "danger",
        cancelText: "Hủy bỏ",
        onOk: () => {
          removeItem(productId);
          message.success(`Đã xoá món "${product.name}"`);
        },
        onCancel: () => {
          // Reset to 1 on cancellation
          setCart((prev) =>
            prev.map((item) =>
              item.product_id === productId ? { ...item, quantity: 1 } : item
            )
          );
        }
      });
      return;
    }

    if (capacity !== null && targetQty > capacity) {
      message.warning(`Không đủ nguyên liệu! Món "${product.name}" chỉ còn lại tối đa ${capacity} phần chế biến.`);
      setCart((prev) =>
        prev.map((item) =>
          item.product_id === productId ? { ...item, quantity: capacity } : item
        )
      );
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: targetQty }
          : item
      )
    );
  };

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const handlePrintTicket = (order) => {
    setActiveOrderToPrint(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

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
        const originalOrder = orders.find((o) => o.id === currentOrderId);
        const originalItems = originalOrder?.order_items || originalOrder?.orderItems || [];

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
                notes: item.notes, // pass notes!
              });
            } else {
              return api.post("/order-items", {
                order_id: currentOrderId,
                product_id: item.product_id,
                quantity: item.quantity,
                notes: item.notes, // pass notes!
              });
            }
          })
        );

        let customerId = existingCustomerId;
        const trimmedName = customerName.trim();
        const trimmedPhone = customerPhone.trim();

        if (!customerId && (trimmedName || trimmedPhone)) {
          if (!trimmedName && trimmedPhone) {
            message.warning("Vui lòng nhập tên khách hàng mới nếu số điện thoại chưa có trong hệ thống");
            setLoading(false);
            return;
          }

          const customerRes = await api.post("/customers", {
            name: trimmedName || null,
            phone: trimmedPhone || null,
          });
          customerId = customerRes.data?.id ?? null;
        }

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
        let customerId = existingCustomerId;
        const trimmedName = customerName.trim();
        const trimmedPhone = customerPhone.trim();

        if (!customerId && (trimmedName || trimmedPhone)) {
          if (!trimmedName && trimmedPhone) {
            message.warning("Vui lòng nhập tên khách hàng mới nếu số điện thoại chưa có trong hệ thống");
            setLoading(false);
            return;
          }

          const customersRes = await api.post("/customers", {
            name: trimmedName || null,
            phone: trimmedPhone || null,
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
              notes: item.notes, // pass notes!
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
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      
      if (status === 409) {
        Modal.error({
          title: "⚠️ Tranh Chấp Đặt Bàn",
          content: msg || "Bàn này đã được sử dụng hoặc đặt chỗ bởi một nhân viên khác. Sơ đồ bàn ăn sẽ tự động làm mới.",
          okText: "Đồng ý",
          onOk: () => {
            setSelectedTable(undefined);
            loadData({ silent: true });
          }
        });
      } else {
        message.error(msg || "Không tạo được đơn");
      }
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
                  ? image.url || ((image.image_url.startsWith("http") || image.image_url.startsWith("data:")) ? image.image_url : `${STORAGE_BASE_URL}/${image.image_url}`)
                  : null;

                const capacity = getProductCapacity(p);
                const isOutOfStock = Number(p.status) === 0 || (capacity !== null && capacity <= 0);

                return (
                  <div key={p.id} style={styles.productCard}>
                    {isOutOfStock && (
                      <div style={styles.outOfStockOverlay}>
                        <span style={styles.outOfStockText}>HẾT MÓN</span>
                      </div>
                    )}
                    <div style={styles.imageWrap}>
                      {imageUrl ? (
                        <img src={imageUrl} alt={p.name} style={styles.productImage} />
                      ) : (
                        <div style={styles.noImage}>Không ảnh</div>
                      )}
                    </div>
                    <div style={styles.productName}>{p.name}</div>
                    {/* Capacity Indicator */}
                    <div style={{ fontSize: 11, color: capacity === null ? "#22c55e" : capacity <= 3 ? "#ef4444" : "#64748b", fontWeight: "500", marginTop: -4 }}>
                      {capacity === null ? "🟢 Còn hàng" : capacity > 0 ? `📦 Còn: ${capacity} phần` : "🔴 Hết nguyên liệu"}
                    </div>
                    <div style={styles.productPrice}>{formatMoney(p.price)}</div>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      block
                      onClick={() => addToCart(p)}
                      disabled={isOutOfStock}
                    >
                      {isOutOfStock ? "Hết món" : "Thêm"}
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
                <div key={item.product_id} style={{ ...styles.cartRow, gridTemplateRows: "auto auto", height: "auto" }}>
                  <div style={styles.cartIndex}>{index + 1}</div>
                  <div style={styles.cartInfo}>
                    <div style={styles.cartName}>{item.name}</div>
                    <div style={styles.cartLinePrice}>{formatMoney(item.price)}</div>
                  </div>
                  <InputNumber
                    min={0}
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
                  {/* Notes input row below */}
                  <div style={{ gridColumn: "2 / 5", width: "100%", paddingBottom: 4 }}>
                    <Input
                      size="small"
                      placeholder="Ghi chú (ít cay, không hành, nhiều đá...)"
                      value={item.notes || ""}
                      onChange={(e) => updateItemNotes(item.product_id, e.target.value)}
                      style={{ fontSize: 11, borderRadius: 4 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.billFooter}>
              <div style={styles.totalBox}>
                <span>Tổng tiền</span>
                <strong>{formatMoney(total)}</strong>
              </div>
              <Row gutter={8}>
                {currentOrderId && (
                  <Col span={8}>
                    <Button
                      icon={<PrinterOutlined />}
                      block
                      size="large"
                      onClick={() => {
                        const order = orders.find((o) => o.id === currentOrderId);
                        if (order) handlePrintTicket(order);
                      }}
                    >
                      In bếp
                    </Button>
                  </Col>
                )}
                <Col span={currentOrderId ? 16 : 24}>
                  <Button
                    type="primary"
                    size="large"
                    loading={loading}
                    onClick={submitOrder}
                    block
                  >
                    {currentOrderId ? "Cập nhật đơn" : "Tạo đơn"}
                  </Button>
                </Col>
              </Row>
            </div>
          </div>
        </Col>
      </Row>

      {/* CSS and Printer layout for browser print */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #order-desk-print-ticket, #order-desk-print-ticket * {
              visibility: visible;
            }
            #order-desk-print-ticket {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm;
              padding: 5mm;
              font-family: 'Courier New', Courier, monospace;
              color: #000;
              background: #fff;
            }
          }
        `}
      </style>

      {/* Printer-friendly Thermal Receipt Layout */}
      {activeOrderToPrint && (
        <div id="order-desk-print-ticket" style={{ display: "none" }}>
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
              {(activeOrderToPrint.order_items || activeOrderToPrint.orderItems)?.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px dotted #000" }}>
                  <td style={{ fontSize: 13, padding: "4px 0" }}>
                    <strong>{item.product?.name}</strong>
                    {item.notes && (
                      <div style={{ fontSize: 11, fontStyle: "italic", margin: "2px 0 0 5px" }}>
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
      position: "relative",
      border: darkMode ? "1px solid #25314d" : "1px solid #dbe4f0",
      borderRadius: 10,
      background: darkMode ? "#0b1220" : "#fff",
      padding: 8,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      overflow: "hidden",
    },
    outOfStockOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: darkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.55)",
      backdropFilter: "blur(2px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
    outOfStockText: {
      color: "#ff4d4f",
      fontSize: "15px",
      fontWeight: "bold",
      border: "2px solid #ff4d4f",
      padding: "4px 10px",
      borderRadius: 6,
      transform: "rotate(-12deg)",
      background: darkMode ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.9)",
      letterSpacing: "1px",
      boxShadow: "0 0 10px rgba(255, 77, 79, 0.4)",
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
