import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminTable from "../../components/AdminTable";
import AdminForm from "../../components/AdminForm";
import Modal from "../../components/Modal";
import useDarkMode from "../../hooks/useDarkMode";

export default function Tables() {
  const isDarkMode = useDarkMode();
  const styles = getStyles(isDarkMode);
  const [tables, setTables] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchTables = async () => {
    try {
      const res = await api.get("/tables");
      setTables(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const fields = [
    { label: "Tên bàn", name: "name" },
    {
      label: "Trạng thái",
      name: "status",
      type: "select",
      options: [
        { value: "available", label: "Trống" },
        { value: "occupied", label: "Đang dùng" },
        { value: "reserved", label: "Đã đặt trước" },
      ],
    },
  ];

  const handleSubmit = async (data) => {
    try {
      const payload = {
        name: data.name,
        status: data.status,
      };

      if (editing) {
        await api.put(`/tables/${editing.id}`, payload);
        alert("Cập nhật bàn thành công");
      } else {
        await api.post("/tables", payload);
        alert("Thêm bàn thành công");
      }

      setShowForm(false);
      setEditing(null);
      fetchTables();
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa bàn này?")) return;
    await api.delete(`/tables/${id}`);
    fetchTables();
  };

  const columns = ["STT", "Tên", "Trạng thái", "Hành động"];

  const tableData = tables.map((t, index) => ({
    stt: index + 1,
    name: t.name,
    status: t.status === "available" ? "Trống" : t.status === "occupied" ? "Đang dùng" : t.status === "reserved" ? "Đã đặt trước" : t.status,
    action: (
      <div style={styles.actionGroup}>
        <button
          style={{ ...styles.actionBtn, ...styles.editBtn }}
          onClick={() => {
            setEditing(t);
            setShowForm(true);
          }}
        >
          Sửa
        </button>
        <button style={{ ...styles.actionBtn, ...styles.deleteBtn }} onClick={() => handleDelete(t.id)}>
          Xóa
        </button>
      </div>
    ),
  }));

  return (
    <div>
      <h2 style={styles.title}>Quản lý bàn</h2>
      <button
        style={styles.addBtn}
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
      >
        + Thêm bàn
      </button>

      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <AdminForm
            key={editing?.id || "new"}
            fields={fields}
            onSubmit={handleSubmit}
            initialData={
              editing || {
                name: "",
                status: "available",
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

