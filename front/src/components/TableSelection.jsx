import { useState, useMemo, useEffect } from "react";
import { Button, Empty, Spin, Tooltip, Row, Col } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import useDarkMode from "../hooks/useDarkMode";

const getTableStatus = (table) => {
  if (!table.status || table.status === "empty" || table.status === "available") return "available";
  return table.status === "occupied" || table.status === "reserved" ? "occupied" : "available";
};

const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins > 0 ? mins + "m" : ""}`;
};

export default function TableSelection({
  tables = [],
  selectedTable,
  onSelectTable,
  loading = false,
  onAddOrder = null,
}) {
  const darkMode = useDarkMode();
  const [tableUsageTimes, setTableUsageTimes] = useState({});

  // Calculate table usage time
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimes = {};
      tables.forEach((table) => {
        if (table.status === "occupied" && table.current_order_time) {
          const startTime = new Date(table.current_order_time);
          const now = new Date();
          const minutes = Math.floor((now - startTime) / 60000);
          newTimes[table.id] = minutes;
        }
      });
      setTableUsageTimes(newTimes);
    }, 1000);

    return () => clearInterval(interval);
  }, [tables]);

  const getTableColor = (table) => {
    const status = getTableStatus(table);
    if (status === "available") return darkMode ? "#10b981" : "#059669";
    return darkMode ? "#ef4444" : "#dc2626";
  };

  const styles = useMemo(
    () => ({
      container: {
        padding: 16,
        borderRadius: 10,
        background: darkMode ? "#111827" : "#fff",
        border: darkMode ? "1px solid #25314d" : "1px solid #dbe4f0",
      },
      title: {
        fontSize: 16,
        fontWeight: 700,
        marginBottom: 16,
        color: darkMode ? "#e2e8f0" : "#0f172a",
      },
      grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 12,
      },
      tableCard: (table, isSelected) => ({
        padding: 16,
        borderRadius: 8,
        border: isSelected
          ? "2px solid #0284c7"
          : `2px solid ${getTableColor(table)}`,
        background: darkMode ? "#0b1220" : "#f8fafc",
        cursor: "pointer",
        transition: "all 0.2s",
        textAlign: "center",
        position: "relative",
      }),
      tableName: {
        fontSize: 14,
        fontWeight: 700,
        color: darkMode ? "#e2e8f0" : "#0f172a",
        marginBottom: 4,
      },
      tableSeats: {
        fontSize: 12,
        color: darkMode ? "#94a3b8" : "#64748b",
        marginBottom: 8,
      },
      tableStatus: (table) => ({
        fontSize: 12,
        fontWeight: 600,
        color:
          getTableStatus(table) === "available"
            ? darkMode
              ? "#10b981"
              : "#059669"
            : darkMode
            ? "#ef4444"
            : "#dc2626",
        marginBottom: 8,
      }),
      usageTime: {
        fontSize: 12,
        color: darkMode ? "#60a5fa" : "#0284c7",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      },
      badge: (table) => ({
        position: "absolute",
        top: 8,
        right: 8,
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: getTableColor(table),
      }),
      actionBtn: {
        marginTop: 8,
        width: "100%",
      },
    }),
    [darkMode]
  );

  if (loading) {
    return (
      <div style={styles.container}>
        <Spin size="large" />
      </div>
    );
  }

  if (!tables || tables.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.title}>Chọn Bàn</div>
        <Empty description="Không có bàn nào" />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.title}>📋 Chọn Bàn</div>
      <Row gutter={[12, 12]}>
        {tables.map((table) => {
          const isSelected = selectedTable === table.id;
          const status = getTableStatus(table);
          const usageMinutes = tableUsageTimes[table.id];

          return (
            <Col key={table.id} xs={12} sm={8} md={6} lg={4}>
              <Tooltip
                title={
                  status === "available"
                    ? "Bàn trống - Nhấn để chọn"
                    : `Bàn đã có khách - Chọn để thêm món`
                }
              >
                <div
                  style={{
                    ...styles.tableCard(table, isSelected),
                    transform: isSelected ? "scale(1.05)" : "scale(1)",
                    boxShadow: isSelected
                      ? "0 0 0 2px rgba(2, 132, 199, 0.2)"
                      : "none",
                  }}
                  onClick={() => onSelectTable(table.id)}
                >
                  <div style={styles.badge(table)} />

                  <div style={styles.tableName}>{table.name}</div>

                  <div style={styles.tableSeats}>
                    👥 {table.seats || 2} chỗ
                  </div>

                  <div style={styles.tableStatus(table)}>
                    {status === "available" ? "✓ Trống" : "● Có khách"}
                  </div>

                  {usageMinutes !== undefined && (
                    <div style={styles.usageTime}>
                      <ClockCircleOutlined />
                      {formatDuration(usageMinutes)}
                    </div>
                  )}

                  {isSelected && (
                    <Button type="primary" size="small" style={styles.actionBtn}>
                      ✓ Chọn
                    </Button>
                  )}

                  {status === "occupied" && onAddOrder && !isSelected && (
                    <Button
                      size="small"
                      type="dashed"
                      style={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddOrder(table.id);
                      }}
                    >
                      Thêm món
                    </Button>
                  )}
                </div>
              </Tooltip>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
