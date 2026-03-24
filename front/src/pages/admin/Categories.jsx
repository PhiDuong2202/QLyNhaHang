import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminTable from "../../components/AdminTable";
import AdminForm from "../../components/AdminForm";
import Modal from "../../components/Modal";
import useDarkMode from "../../hooks/useDarkMode";

export default function Categories() {
  const isDarkMode = useDarkMode();
  const styles = getStyles(isDarkMode);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fields = [
    { label: "Tên danh mục", name: "name" },
    { label: "Mô tả", name: "description", type: "textarea" },
  ];

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (data) => {
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, data);
        alert("Cập nhật thành công");
      } else {
        await api.post("/categories", data);
        alert("Thêm thành công");
      }

      fetchCategories();
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa danh mục này?")) return;
    await api.delete(`/categories/${id}`);
    fetchCategories();
  };

  const handleEdit = (cat) => {
    setEditing(cat);
    setShowForm(true);
  };

  const columns = ["STT", "Tên", "Mô tả", "Hành động"];

  const tableData = categories.map((c, index) => ({
    id: index + 1,
    name: c.name,
    description: c.description,
    action: (
      <div style={styles.actionGroup}>
          <button style={{ ...styles.actionBtn, ...styles.editBtn }} onClick={() => handleEdit(c)}>
          Sửa
        </button>
        <button style={{ ...styles.actionBtn, ...styles.deleteBtn }} onClick={() => handleDelete(c.id)}>
          Xóa
        </button>
      </div>
    ),
  }));

  return (
    <div>
      <h2 style={styles.title}>Quản lý danh mục</h2>

      <button
        style={styles.addBtn}
        onClick={() => {
          setShowForm(true);
          setEditing(null);
        }}
      >
        + Thêm danh mục
      </button>

      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <AdminForm
            key={editing?.id || "new"}
            fields={fields}
            onSubmit={handleSubmit}
            initialData={editing || {}}
          />
        </Modal>
      )}

      <AdminTable columns={columns} data={tableData} />
    </div>
  );
}

const getStyles = (isDarkMode) => ({
  title: {
    marginBottom: 12,
    color: isDarkMode ? "#e2e8f0" : "#0f172a",
  },
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
  actionGroup: {
    display: "flex",
    gap: 8,
  },
  actionBtn: {
    border: "none",
    borderRadius: 8,
    padding: "6px 10px",
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  editBtn: {
    background: isDarkMode ? "#0284c7" : "#0ea5e9",
  },
  deleteBtn: {
    background: isDarkMode ? "#dc2626" : "#ef4444",
  },
});

