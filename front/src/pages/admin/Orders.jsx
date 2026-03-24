import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminTable from "../../components/AdminTable";
import AdminForm from "../../components/AdminForm";
import Modal from "../../components/Modal";
import useDarkMode from "../../hooks/useDarkMode";

export default function Orders() {
  const isDarkMode = useDarkMode();
  const styles = getStyles(isDarkMode);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchOrders();
    api.get("/tables").then((res) => setTables(res.data));
  }, []);

  const fields = [
    { name: "customer_name", label: "Tên khách hàng", type: "text" },
    { name: "customer_phone", label: "Số điện thoại khách", type: "text" },
    {
      name: "order_type",
      label: "Loại khách",
      type: "select",
      options: [
        { value: "dine_in", label: "Tại chỗ" },
        { value: "take_away", label: "Mang về" },
        { value: "preorder", label: "Khách đặt" },
      ],
    },
    {
      name: "table_id",
      label: "Bàn",
      type: "select",
      options: tables.map((t) => ({ value: t.id, label: t.name || `Bàn ${t.id}` })),
    },
    { name: "total_price", label: "Tổng tiền", type: "number" },
    {
      name: "status",
      label: "Trạng thái",
      type: "select",
      options: [
        { value: "pending", label: "Đang chờ" },
        { value: "processing", label: "Đang làm" },
        { value: "completed", label: "Hoàn thành" },
        { value: "cancelled", label: "Hủy" },
      ],
    },
  ];

  const handleSubmit = async (data) => {
    try {
      const requiresTable = (data.order_type || "dine_in") !== "take_away";
      if (requiresTable && !data.table_id) {
        alert("Vui lòng chọn bàn.");
        return;
      }

      let customerId = null;
      if (data.customer_name) {
        const res = await api.post("/customers", {
          name: data.customer_name,
          phone: data.customer_phone || null,
        });
        customerId = res.data.id;
      }

      const payload = {
        customer_id: customerId,
        order_type: data.order_type || "dine_in",
        table_id: requiresTable ? data.table_id : null,
        total_price: Number(data.total_price || 0),
        status: data.status || "pending",
      };

      if (editing) {
        await api.put(`/orders/${editing.id}`, payload);
        alert("Cập nhật đơn hàng thành công");
      } else {
        await api.post("/orders", payload);
        alert("Thêm đơn hàng thành công");
      }

      setShowForm(false);
      setEditing(null);
      fetchOrders();
    } catch (err) {
      console.log(err.response?.data || err);
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === "string"
          ? err.response.data
          : "Không lưu được đơn hàng, vui lòng kiểm tra lại dữ liệu.");
      alert(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa đơn hàng này?")) return;
    await api.delete(`/orders/${id}`);
    fetchOrders();
  };

  const columns = ["STT", "Khách", "Loại khách", "Bàn", "Tổng tiền", "Trạng thái", "Hành động"];

  const tableData = orders.map((o, index) => {
    const customerName = o.customer ? o.customer.name : "Khách lẻ";
    const customerPhone = o.customer?.phone || "";

    return {
      stt: index + 1,
      customer: customerPhone ? `${customerName} - ${customerPhone}` : customerName,
      order_type:
        o.order_type === "take_away"
          ? "Mang về"
          : o.order_type === "preorder"
          ? "Khách đặt"
          : "Tại chỗ",
      table: o.table ? o.table.name || `Bàn ${o.table.id}` : "Không có",
      total: o.total_price,
      status:
        o.status === "processing"
          ? "Đang làm"
          : o.status === "completed"
          ? "Hoàn thành"
          : o.status === "cancelled"
          ? "Hủy"
          : "Đang chờ",
      action: (
        <div style={styles.actionGroup}>
          <button
            style={{ ...styles.actionBtn, ...styles.editBtn }}
            onClick={() => {
              setEditing(o);
              setShowForm(true);
            }}
          >
            Sửa
          </button>
          <button style={{ ...styles.actionBtn, ...styles.deleteBtn }} onClick={() => handleDelete(o.id)}>
            Xóa
          </button>
        </div>
      ),
    };
  });

  return (
    <div>
      <h2 style={styles.title}>Đơn hàng</h2>

      <button
        style={styles.addBtn}
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
      >
        + Thêm đơn hàng
      </button>

      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <AdminForm
            key={editing?.id || "new"}
            fields={fields}
            onSubmit={handleSubmit}
            initialData={
              editing
                ? (() => {
                    const isPreorder = editing.order_type === "preorder";
                    return {
                      customer_name: isPreorder && editing.customer ? editing.customer.name : "",
                      customer_phone: isPreorder && editing.customer ? editing.customer.phone || "" : "",
                      order_type: editing.order_type || "dine_in",
                      table_id: editing.table_id || "",
                      total_price: editing.total_price ?? 0,
                      status: editing.status || "pending",
                    };
                  })()
                : {
                    customer_name: "",
                    customer_phone: "",
                    order_type: "dine_in",
                    table_id: "",
                    total_price: 0,
                    status: "pending",
                  }
            }
          />
        </Modal>
      )}

      <AdminTable columns={columns} data={tableData} />
    </div>
  );
}

const getStyles = (isDarkMode) => ({
  title: { marginBottom: 12 },
  addBtn: {
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    marginBottom: 14,
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: isDarkMode ? "0 8px 18px rgba(37, 99, 235, 0.35)" : "0 8px 18px rgba(37, 99, 235, 0.2)",
  },
  actionGroup: { display: "flex", gap: 8 },
  actionBtn: {
    border: "none",
    borderRadius: 8,
    padding: "6px 10px",
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  editBtn: { background: isDarkMode ? "#0284c7" : "#0ea5e9" },
  deleteBtn: { background: isDarkMode ? "#dc2626" : "#ef4444" },
});
