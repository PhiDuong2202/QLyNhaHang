import { useEffect, useState, useMemo } from "react";
import { message } from "antd";
import api from "../../services/api";
import AdminForm from "../../components/AdminForm";
import Modal from "../../components/Modal";
import useDarkMode from "../../hooks/useDarkMode";

export default function Tables() {
  const isDarkMode = useDarkMode();
  const styles = getStyles(isDarkMode);
  const [tables, setTables] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);

  const fetchTables = async () => {
    try {
      const res = await api.get("/tables");
      const tableList = Array.isArray(res.data) ? res.data : [];
      tableList.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
      setTables(tableList);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const fields = [
    { label: "Tên bàn", name: "name" },
    { label: "Số chỗ", name: "seats", type: "number" },
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
        seats: Number(data.seats) || 4,
        status: data.status,
      };

      if (editing) {
        await api.put(`/tables/${editing.id}`, payload);
        message.success("Cập nhật bàn thành công");
      } else {
        await api.post("/tables", payload);
        message.success("Thêm bàn thành công");
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

  const updateTableOrder = async (newTables) => {
    setTables(newTables);
    await Promise.all(
      newTables.map((table, index) =>
        api.put(`/tables/${table.id}`, {
          ...table,
          sort_order: index + 1,
        })
      )
    );
  };

  const [dropIndex, setDropIndex] = useState(null);

  const handleDragStart = (index) => {
    setDragIndex(index);
    setDropIndex(index);
  };

  const handleDragOver = (index, event) => {
    event.preventDefault();
    setDropIndex(index);
  };

  const handleDrop = async () => {
    if (dragIndex === null || dropIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDropIndex(null);
      return;
    }

    const newTables = [...tables];
    const [moved] = newTables.splice(dragIndex, 1);
    newTables.splice(dropIndex, 0, moved);
    setDragIndex(null);
    setDropIndex(null);
    await updateTableOrder(newTables);
  };

  const statusLabel = (status) => {
    if (status === "available" || status === "empty") return "Trống";
    if (status === "occupied") return "Đang dùng";
    if (status === "reserved") return "Đã đặt trước";
    return status;
  };

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
                seats: 4,
                status: "available",
              }
            }
          />
        </Modal>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>STT</th>
              <th style={styles.th}>Tên bàn</th>
              <th style={styles.th}>Số chỗ</th>
              <th style={styles.th}>Trạng thái</th>
              <th style={styles.th}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((table, index) => (
              <tr
                key={table.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(event) => handleDragOver(index, event)}
                onDrop={handleDrop}
                style={index % 2 === 0 ? styles.trEven : styles.trOdd}
              >
                <td style={styles.td}>{index + 1}</td>
                <td style={styles.td}>{table.name}</td>
                <td style={styles.td}>{table.seats || 4}</td>
                <td style={styles.td}>{statusLabel(table.status)}</td>
                <td style={styles.td}>
                  <div style={styles.actionGroup}>
                    <button
                      style={{ ...styles.actionBtn, ...styles.editBtn }}
                      onClick={() => {
                        setEditing(table);
                        setShowForm(true);
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                      onClick={() => handleDelete(table.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    borderRadius: 12,
    border: isDarkMode ? "1px solid #334155" : "1px solid #e5e7eb",
    background: isDarkMode ? "#111827" : "#fff",
    boxShadow: isDarkMode ? "0 8px 20px rgba(2, 6, 23, 0.45)" : "0 8px 20px rgba(17, 24, 39, 0.06)",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: 720,
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 1,
    textAlign: "left",
    padding: "14px 16px",
    background: isDarkMode ? "#0f172a" : "#f8fafc",
    color: isDarkMode ? "#e2e8f0" : "#334155",
    fontWeight: 700,
    fontSize: 14,
    borderBottom: isDarkMode ? "1px solid #334155" : "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px 16px",
    borderBottom: isDarkMode ? "1px solid #1e293b" : "1px solid #eef2f7",
    color: isDarkMode ? "#cbd5e1" : "#1f2937",
    fontSize: 14,
    verticalAlign: "middle",
  },
  trEven: {
    background: isDarkMode ? "#111827" : "#ffffff",
  },
  trOdd: {
    background: isDarkMode ? "#0b1220" : "#fcfdff",
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

