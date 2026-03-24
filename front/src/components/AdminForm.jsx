import { useState } from "react";
import useDarkMode from "../hooks/useDarkMode";

export default function AdminForm({ fields = [], onSubmit, initialData = {} }) {
  const isDarkMode = useDarkMode();
  const styles = getStyles(isDarkMode);
  const [formData, setFormData] = useState(initialData);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "file" ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {fields.map((field, i) => (
        <div key={i} style={styles.fieldWrapper}>
          <label style={styles.label}>{field.label}</label>

          {field.type === "textarea" && (
            <textarea
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleChange}
              style={{ ...styles.input, ...styles.textarea }}
            />
          )}

          {field.type === "select" && (
            <select
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">-- Chọn giá trị --</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {field.type === "file" && (
            <div style={styles.fileBlock}>
              <input
                type="file"
                name={field.name}
                onChange={handleChange}
                style={styles.fileInput}
              />

              {formData[field.name] && (
                <img
                  src={URL.createObjectURL(formData[field.name])}
                  alt="preview"
                  style={styles.preview}
                />
              )}

              {!formData[field.name] && formData[`${field.name}Preview`] && (
                <img
                  src={formData[`${field.name}Preview`]}
                  alt="preview"
                  style={styles.preview}
                />
              )}
            </div>
          )}

          {field.type === "number" && (
            <input
              type="number"
              name={field.name}
              value={formData[field.name] ?? ""}
              onChange={handleChange}
              style={styles.input}
            />
          )}

          {(!field.type || field.type === "text") && (
            <input
              type="text"
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleChange}
              style={styles.input}
            />
          )}
        </div>
      ))}

      <button type="submit" style={styles.submitBtn}>
        Luu
      </button>
    </form>
  );
}

const getStyles = (isDarkMode) => ({
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    marginTop: 8,
    padding: 16,
    borderRadius: 14,
    border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
    background: isDarkMode
      ? "linear-gradient(180deg, #0f172a 0%, #111827 100%)"
      : "#ffffff",
    boxShadow: isDarkMode
      ? "inset 0 1px 0 rgba(148,163,184,0.15), 0 16px 30px rgba(2,6,23,0.35)"
      : "0 10px 24px rgba(15,23,42,0.08)",
  },
  fieldWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: isDarkMode ? "8px 10px" : 0,
    borderRadius: 10,
    background: isDarkMode ? "rgba(15,23,42,0.45)" : "transparent",
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: isDarkMode ? "#e2e8f0" : "#334155",
  },
  input: {
    width: "100%",
    minHeight: 40,
    border: isDarkMode ? "1px solid #334155" : "1px solid #dbe3ee",
    borderRadius: 10,
    padding: "9px 12px",
    fontSize: 14,
    color: isDarkMode ? "#e2e8f0" : "#0f172a",
    outline: "none",
    boxSizing: "border-box",
    background: isDarkMode ? "#020617" : "#fff",
    boxShadow: isDarkMode
      ? "inset 0 1px 0 rgba(148,163,184,0.12)"
      : "inset 0 1px 0 rgba(148,163,184,0.2)",
  },
  textarea: {
    minHeight: 96,
    resize: "vertical",
  },
  fileBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  fileInput: {
    fontSize: 14,
    color: isDarkMode ? "#cbd5e1" : "#334155",
    padding: "8px 10px",
    borderRadius: 10,
    border: isDarkMode ? "1px dashed #475569" : "1px dashed #cbd5e1",
    background: isDarkMode ? "#0b1220" : "#f8fafc",
  },
  preview: {
    width: 100,
    height: 100,
    objectFit: "cover",
    borderRadius: 10,
    border: isDarkMode ? "1px solid #334155" : "1px solid #dbe3ee",
  },
  submitBtn: {
    marginTop: 8,
    height: 42,
    border: "none",
    borderRadius: 10,
    background: isDarkMode
      ? "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)"
      : "#2563eb",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: isDarkMode
      ? "0 10px 20px rgba(37, 99, 235, 0.45)"
      : "0 8px 16px rgba(37, 99, 235, 0.25)",
  },
});
