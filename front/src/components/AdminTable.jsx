import useDarkMode from "../hooks/useDarkMode";

export default function AdminTable({ columns, data }) {
  const isDarkMode = useDarkMode();
  const styles = getStyles(isDarkMode);

  return (
    <div style={styles.wrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={styles.th}>
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
              {Object.values(row).map((val, j) => (
                <td key={j} style={styles.td}>
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const getStyles = (isDarkMode) => ({
  wrapper: {
    width: "100%",
    overflowX: "auto",
    borderRadius: 12,
    border: isDarkMode ? "1px solid #334155" : "1px solid #e5e7eb",
    boxShadow: isDarkMode
      ? "0 8px 20px rgba(2, 6, 23, 0.45)"
      : "0 8px 20px rgba(17, 24, 39, 0.06)",
    background: isDarkMode ? "#111827" : "#fff",
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
});

