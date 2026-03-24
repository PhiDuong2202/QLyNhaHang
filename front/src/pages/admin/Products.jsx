import { useState, useEffect } from "react";
import api from "../../services/api";
import AdminTable from "../../components/AdminTable";
import AdminForm from "../../components/AdminForm";
import Modal from "../../components/Modal";
import axios from "axios";
import useDarkMode from "../../hooks/useDarkMode";

export default function Products() {
  const isDarkMode = useDarkMode();
  const styles = getStyles(isDarkMode);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState("");
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data));
  }, []);

  const fetchProducts = async (catId) => {
    try {
      const url = catId ? `/products?category_id=${catId}` : "/products";
      const res = await api.get(url);
      setProducts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchProducts(selectedCat);
  }, [selectedCat]);

  const fields = [
    { label: "Tên sản phẩm", name: "name" },
    { label: "Giá", name: "price", type: "number" },
    { label: "Ảnh", name: "image", type: "file" },
    {
      name: "status",
      label: "Trạng thái",
      type: "select",
      options: [
        { value: 1, label: "Còn món" },
        { value: 0, label: "Hết món" },
      ],
    },
  ];

  const handleSubmit = async (data) => {
    try {
      if (!editing) {
        const nameTrimmed = (data.name || "").trim().toLowerCase();
        const isDuplicate = products.some((p) => p.name.trim().toLowerCase() === nameTrimmed);

        if (isDuplicate) {
          alert("Sản phẩm với tên này đã tồn tại trong danh mục đang chọn.");
          return;
        }
      }

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("price", data.price);
      formData.append("category_id", data.category_id || selectedCat);
      formData.append("status", data.status);

      if (data.image) {
        formData.append("image", data.image);
      }

      if (editing) {
        await axios.post(`http://localhost:8000/api/products/${editing.id}?_method=PUT`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        alert("Cập nhật thành công");
      } else {
        await axios.post("http://localhost:8000/api/products", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        alert("Thêm thành công");
      }

      setShowForm(false);
      setEditing(null);
      fetchProducts(selectedCat);
    } catch (err) {
      console.log(err.response?.data);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa sản phẩm?")) return;
    await api.delete(`/products/${id}`);
    fetchProducts(selectedCat);
  };

  const columns = ["STT", "Tên", "Giá", "Trạng thái", "Ảnh", "Hành động"];

  const tableData = products.map((p, i) => {
    const firstImage = p.images?.[0];
    const imageUrl = firstImage
      ? firstImage.url || `http://localhost:8000/storage/${firstImage.image_url}`
      : null;

    return {
      stt: i + 1,
      name: p.name,
      price: p.price,
      status: Number(p.status) === 1 ? "Còn món" : "Hết món",
      image: imageUrl ? <img src={imageUrl} width="50" style={{ borderRadius: 8 }} /> : "Không có",
      action: (
        <div style={styles.actionGroup}>
          <button
            style={{ ...styles.actionBtn, ...styles.editBtn }}
            onClick={() => {
              setEditing(p);
              setShowForm(true);
            }}
          >
            Sửa
          </button>
          <button style={{ ...styles.actionBtn, ...styles.deleteBtn }} onClick={() => handleDelete(p.id)}>
            Xóa
          </button>
        </div>
      ),
    };
  });

  return (
    <div>
      <h2 style={styles.title}>Quản lý sản phẩm, món ăn</h2>

      <select style={styles.select} value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)}>
        <option value="">-- Chọn danh mục --</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <div style={{ marginTop: 12, marginBottom: 14 }}>
        <button
          style={{ ...styles.addBtn, opacity: selectedCat ? 1 : 0.6, cursor: selectedCat ? "pointer" : "not-allowed" }}
          disabled={!selectedCat}
          onClick={() => {
            setShowForm(true);
            setEditing(null);
          }}
        >
          + Thêm sản phẩm
        </button>
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <AdminForm
            key={editing?.id || "new"}
            fields={fields}
            onSubmit={handleSubmit}
            initialData={
              editing
                ? (() => {
                    const firstImage = editing.images?.[0];
                    const imageUrl = firstImage
                      ? firstImage.url || `http://localhost:8000/storage/${firstImage.image_url}`
                      : null;

                    return {
                      ...editing,
                      imagePreview: imageUrl,
                    };
                  })()
                : { category_id: selectedCat }
            }
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
  select: {
    minWidth: 260,
    minHeight: 40,
    border: isDarkMode ? "1px solid #334155" : "1px solid #dbe3ee",
    borderRadius: 10,
    padding: "9px 12px",
    background: isDarkMode ? "#0f172a" : "#fff",
    color: isDarkMode ? "#e2e8f0" : "#0f172a",
  },
  addBtn: {
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
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
