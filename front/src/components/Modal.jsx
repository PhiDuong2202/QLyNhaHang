import { useEffect, useState } from "react";
import useDarkMode from "../hooks/useDarkMode";

export default function Modal({ children, onClose }) {
  const isDarkMode = useDarkMode();
  const styles = getStyles(isDarkMode);
  const [show, setShow] = useState(false);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 200);
  };

  useEffect(() => {
    setTimeout(() => setShow(true), 10);

    const handleEsc = (e) => {
      if (e.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div
      style={{
        ...styles.overlayStyle,
        opacity: show ? 1 : 0,
        transition: "opacity 0.2s ease",
      }}
      onClick={handleClose}
    >
      <div
      style={{
          ...styles.modalStyle,
          transform: show ? "scale(1)" : "scale(0.95)",
          opacity: show ? 1 : 0,
          transition: "all 0.2s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button style={styles.closeBtn} onClick={handleClose}>
          x
        </button>

        {children}
      </div>
    </div>
  );
}

const getStyles = (isDarkMode) => ({
  overlayStyle: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(15, 23, 42, 0.5)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    padding: 16,
    boxSizing: "border-box",
  },
  modalStyle: {
    background: isDarkMode ? "transparent" : "#fff",
    padding: isDarkMode ? 0 : 20,
    borderRadius: 14,
    width: "min(560px, 100%)",
    border: isDarkMode ? "none" : "1px solid #e2e8f0",
    boxShadow: isDarkMode ? "none" : "0 16px 40px rgba(15, 23, 42, 0.2)",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  closeBtn: {
    float: "right",
    width: 30,
    height: 30,
    border: isDarkMode ? "1px solid #334155" : "1px solid #d6deea",
    borderRadius: 999,
    background: isDarkMode ? "#0b1220" : "#f8fafc",
    color: isDarkMode ? "#e2e8f0" : "#0f172a",
    fontSize: 14,
    cursor: "pointer",
    marginBottom: isDarkMode ? 8 : 0,
  },
});
