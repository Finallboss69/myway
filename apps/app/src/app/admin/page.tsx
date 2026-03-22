"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  Bike,
  BarChart3,
  BookOpen,
  AlertTriangle,
  Clock,
  TrendingUp,
  Package,
} from "lucide-react";
import { formatCurrency, elapsedMinutes } from "@/lib/utils";
import type { Order, Table, Ingredient } from "@/lib/types";
import { apiFetch } from "@/lib/api";

// ─── Admin sidebar ────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/menu", label: "Menú", icon: UtensilsCrossed },
  { href: "/admin/employees", label: "Personal", icon: Users },
  { href: "/admin/delivery", label: "Delivery", icon: Bike },
  { href: "/admin/analytics", label: "Analíticas", icon: BarChart3 },
  { href: "/admin/accounting", label: "Contabilidad", icon: BookOpen },
];

function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav className="sidebar" style={{ width: 220 }}>
      <div
        style={{
          padding: "22px 20px 18px",
          borderBottom: "1px solid var(--s3)",
        }}
      >
        <div
          className="font-kds text-brand-500"
          style={{ fontSize: 26, letterSpacing: "0.2em", lineHeight: 1 }}
        >
          MY WAY
        </div>
        <div
          className="font-display text-ink-disabled uppercase"
          style={{ fontSize: 9, letterSpacing: "0.35em", marginTop: 3 }}
        >
          Administración
        </div>
      </div>

      <div className="flex flex-col gap-0.5 p-2 flex-1 mt-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? "active" : ""}`}
            >
              <Icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div style={{ padding: "14px 16px", borderTop: "1px solid var(--s3)" }}>
        <Link
          href="/pos/salon"
          className="sidebar-item"
          style={{ padding: "8px 10px", fontSize: 10 }}
        >
          <LayoutDashboard size={13} />
          Ir al POS
        </Link>
      </div>
    </nav>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-3">
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <span
          className="font-display text-ink-disabled uppercase tracking-widest"
          style={{ fontSize: 9, letterSpacing: "0.25em" }}
        >
          {label}
        </span>
      </div>
      <div
        className="font-kds"
        style={{ fontSize: 38, lineHeight: 1, color }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="font-body text-ink-disabled mt-1"
          style={{ fontSize: 11 }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const [o, t, ing] = await Promise.all([
        apiFetch<Order[]>("/api/orders"),
        apiFetch<Table[]>("/api/tables"),
        apiFetch<Ingredient[]>("/api/ingredients"),
      ]);
      setOrders(o);
      setTables(t);
      setIngredients(ing);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 10000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const activeOrders = orders.filter(
    (o) => o.status !== "closed" && o.status !== "cancelled",
  );
  const occupiedTables = tables.filter((t) => t.status === "occupied").length;
  const lowStock = ingredients.filter(
    (i) => i.stockCurrent <= i.alertThreshold,
  );

  const totalRevenue = activeOrders.reduce(
    (s, o) => s + o.items.reduce((si, i) => si + i.qty * i.price, 0),
    0,
  );

  const tableColorMap: Record<string, string> = {
    available: "#10b981",
    occupied: "#f59e0b",
    reserved: "#8b5cf6",
  };

  return (
    <div className="min-h-screen bg-surface-0" style={{ display: "flex" }}>
      <AdminSidebar />

      <div
        style={{ marginLeft: 220, flex: 1, minHeight: "100vh", padding: 28 }}
      >
        {/* Page header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1
              className="font-display text-ink-primary"
              style={{ fontSize: 20, fontWeight: 700 }}
            >
              Dashboard
            </h1>
            <div
              className="font-body text-ink-disabled mt-1"
              style={{ fontSize: 12 }}
            >
              Vista general del sistema
            </div>
          </div>
          <div
            className="font-body text-ink-disabled"
            style={{ fontSize: 11 }}
          >
            Actualiza cada 10s
          </div>
        </div>

        {/* KPI stats */}
        <div
          className="grid gap-4 mb-7"
          style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
        >
          <StatCard
            label="Pedidos activos"
            value={activeOrders.length}
            sub={`${orders.filter((o) => o.status === "preparing").length} preparando`}
            color="#3b82f6"
            icon={TrendingUp}
          />
          <StatCard
            label="Mesas ocupadas"
            value={occupiedTables}
            sub={`de ${tables.length} totales`}
            color="#f59e0b"
            icon={LayoutDashboard}
          />
          <StatCard
            label="Stock bajo"
            value={lowStock.length}
            sub={lowStock.length > 0 ? "Requieren atención" : "Todo en orden"}
            color={lowStock.length > 0 ? "#ef4444" : "#10b981"}
            icon={AlertTriangle}
          />
          <StatCard
            label="Ingresos activos"
            value={formatCurrency(totalRevenue)}
            sub="pedidos abiertos"
            color="#10b981"
            icon={Package}
          />
        </div>

        <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Active orders table */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--s3)",
              }}
            >
              <h2
                className="font-display text-ink-primary uppercase"
                style={{ fontSize: 11, letterSpacing: "0.2em" }}
              >
                Pedidos activos
              </h2>
            </div>
            <div style={{ maxHeight: 340, overflowY: "auto" }}>
              {activeOrders.length === 0 ? (
                <div
                  className="text-center py-10 text-ink-disabled font-body"
                  style={{ fontSize: 12 }}
                >
                  Sin pedidos activos
                </div>
              ) : (
                activeOrders.map((order) => {
                  const total = order.items.reduce(
                    (s, i) => s + i.qty * i.price,
                    0,
                  );
                  const elapsed = elapsedMinutes(order.createdAt);
                  const sColor =
                    order.status === "preparing"
                      ? "#3b82f6"
                      : order.status === "ready"
                        ? "#10b981"
                        : "#f59e0b";
                  return (
                    <div
                      key={order.id}
                      className="flex items-center gap-3"
                      style={{
                        padding: "10px 20px",
                        borderBottom: "1px solid var(--s3)",
                      }}
                    >
                      <div
                        style={{
                          width: 3,
                          height: 32,
                          borderRadius: 3,
                          background: sColor,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        className="font-kds text-ink-primary"
                        style={{ fontSize: 18, lineHeight: 1, minWidth: 70 }}
                      >
                        Mesa {order.tableNumber}
                      </span>
                      <span
                        className="font-body text-ink-disabled flex-1"
                        style={{ fontSize: 11 }}
                      >
                        {order.items.length} ítems
                      </span>
                      <div className="flex items-center gap-1">
                        <Clock size={10} style={{ color: "#555" }} />
                        <span
                          className="font-kds"
                          style={{
                            fontSize: 13,
                            color:
                              elapsed > 20
                                ? "#ef4444"
                                : elapsed > 10
                                  ? "#f59e0b"
                                  : "#555",
                          }}
                        >
                          {elapsed}m
                        </span>
                      </div>
                      <span
                        className="font-kds text-brand-500"
                        style={{ fontSize: 14, minWidth: 80, textAlign: "right" }}
                      >
                        {formatCurrency(total)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right column: tables map + stock alerts */}
          <div className="flex flex-col gap-5">
            {/* Tables mini map */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--s3)",
                }}
              >
                <h2
                  className="font-display text-ink-primary uppercase"
                  style={{ fontSize: 11, letterSpacing: "0.2em" }}
                >
                  Estado de mesas
                </h2>
              </div>
              <div
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {tables.map((t) => (
                  <Link
                    key={t.id}
                    href={`/pos/salon/${t.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 10,
                        border: `2px solid ${tableColorMap[t.status] ?? "#333"}40`,
                        background: `${tableColorMap[t.status] ?? "#333"}12`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <span
                        className="font-kds"
                        style={{
                          fontSize: 16,
                          color: tableColorMap[t.status] ?? "#555",
                          lineHeight: 1,
                        }}
                      >
                        {t.number}
                      </span>
                      <span style={{ fontSize: 9 }}>
                        {t.type === "pool" ? "🎱" : "🍺"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Stock alerts */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--s3)",
                }}
              >
                <h2
                  className="font-display text-ink-primary uppercase flex items-center gap-2"
                  style={{ fontSize: 11, letterSpacing: "0.2em" }}
                >
                  <AlertTriangle
                    size={12}
                    style={{
                      color: lowStock.length > 0 ? "#ef4444" : "#555",
                    }}
                  />
                  Stock bajo
                  {lowStock.length > 0 && (
                    <span
                      style={{
                        background: "rgba(239,68,68,0.15)",
                        color: "#ef4444",
                        border: "1px solid rgba(239,68,68,0.25)",
                        fontFamily: "var(--font-syne)",
                        fontSize: 9,
                        fontWeight: 700,
                        borderRadius: "99px",
                        padding: "1px 7px",
                      }}
                    >
                      {lowStock.length}
                    </span>
                  )}
                </h2>
              </div>
              <div style={{ maxHeight: 180, overflowY: "auto" }}>
                {lowStock.length === 0 ? (
                  <div
                    className="text-center py-6 text-ink-disabled font-body"
                    style={{ fontSize: 12 }}
                  >
                    Todo en orden ✓
                  </div>
                ) : (
                  lowStock.map((ing) => (
                    <div
                      key={ing.id}
                      className="flex items-center gap-3"
                      style={{
                        padding: "10px 20px",
                        borderBottom: "1px solid var(--s3)",
                      }}
                    >
                      <AlertTriangle size={13} style={{ color: "#ef4444" }} />
                      <span
                        className="font-body text-ink-secondary flex-1"
                        style={{ fontSize: 13 }}
                      >
                        {ing.name}
                      </span>
                      <span
                        className="font-kds"
                        style={{ fontSize: 14, color: "#ef4444" }}
                      >
                        {ing.stockCurrent} {ing.unit}
                      </span>
                      <span
                        className="font-body text-ink-disabled"
                        style={{ fontSize: 11 }}
                      >
                        / {ing.alertThreshold}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
