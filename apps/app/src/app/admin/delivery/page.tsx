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
  Phone,
  MapPin,
  Clock,
  ChevronRight,
  Plus,
  Check,
  X,
} from "lucide-react";
import { formatCurrency, elapsedMinutes, formatTime } from "@/lib/utils";
import type { DeliveryOrder, DeliveryStatus } from "@/lib/types";
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

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: "Pendiente",
  preparing: "Preparando",
  on_the_way: "En camino",
  delivered: "Entregado",
};

const STATUS_COLORS: Record<DeliveryStatus, string> = {
  pending: "#f59e0b",
  preparing: "#3b82f6",
  on_the_way: "#8b5cf6",
  delivered: "#10b981",
};

const NEXT_STATUS: Record<DeliveryStatus, DeliveryStatus | null> = {
  pending: "preparing",
  preparing: "on_the_way",
  on_the_way: "delivered",
  delivered: null,
};

const NEXT_STATUS_LABEL: Record<DeliveryStatus, string> = {
  pending: "Iniciar prep.",
  preparing: "En camino",
  on_the_way: "Marcar entregado",
  delivered: "",
};

// ─── Order card ───────────────────────────────────────────────────────────────

function DeliveryCard({
  order,
  onUpdateStatus,
}: {
  order: DeliveryOrder;
  onUpdateStatus: (id: string, status: DeliveryStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = STATUS_COLORS[order.status];
  const elapsed = elapsedMinutes(order.createdAt);
  const next = NEXT_STATUS[order.status];

  return (
    <div
      className="card-sm animate-fade-in"
      style={{ overflow: "hidden", marginBottom: 10 }}
    >
      {/* Top color stripe */}
      <div
        style={{ height: 3, background: color, boxShadow: `0 0 8px ${color}60` }}
      />

      <div style={{ padding: "16px 18px" }}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div style={{ flex: 1 }}>
            <div
              className="font-body text-ink-primary"
              style={{ fontSize: 15, fontWeight: 600 }}
            >
              {order.customerName}
            </div>
            <div
              className="flex items-center gap-2 mt-1"
              style={{ color: "#666", fontSize: 12 }}
            >
              <MapPin size={11} />
              <span className="font-body">{order.address}</span>
            </div>
            {order.phone && (
              <div
                className="flex items-center gap-2 mt-0.5"
                style={{ color: "#555", fontSize: 12 }}
              >
                <Phone size={11} />
                <span className="font-body">{order.phone}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              style={{
                fontSize: 9,
                padding: "3px 10px",
                borderRadius: 99,
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color,
                background: `${color}18`,
                border: `1px solid ${color}30`,
              }}
            >
              {STATUS_LABELS[order.status]}
            </span>
            <div className="flex items-center gap-1" style={{ color: "#555" }}>
              <Clock size={10} />
              <span
                className="font-kds"
                style={{
                  fontSize: 13,
                  color:
                    elapsed > 40 ? "#ef4444" : elapsed > 20 ? "#f59e0b" : "#555",
                }}
              >
                {elapsed}m
              </span>
              <span className="font-body text-ink-disabled" style={{ fontSize: 10 }}>
                · {formatTime(order.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Total + items toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="font-kds text-brand-500"
              style={{ fontSize: 18, lineHeight: 1 }}
            >
              {formatCurrency(order.total)}
            </span>
            <span className="font-body text-ink-disabled" style={{ fontSize: 11 }}>
              {order.items.length} ítem{order.items.length !== 1 ? "s" : ""}
            </span>
            <span
              style={{
                fontSize: 9,
                padding: "2px 8px",
                borderRadius: 99,
                fontFamily: "var(--font-syne)",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#666",
                border: "1px solid var(--s4)",
              }}
            >
              {order.paymentMethod}
            </span>
          </div>
          <button
            className="btn-ghost"
            style={{ padding: "4px 8px", fontSize: 11 }}
            onClick={() => setExpanded((p) => !p)}
          >
            Ver ítems
            <ChevronRight
              size={12}
              style={{
                transform: expanded ? "rotate(90deg)" : "none",
                transition: "transform 0.15s",
              }}
            />
          </button>
        </div>

        {/* Items list */}
        {expanded && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 0",
              borderTop: "1px solid var(--s3)",
            }}
          >
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3"
                style={{ padding: "4px 0" }}
              >
                <span
                  className="font-kds text-ink-disabled"
                  style={{ fontSize: 14, minWidth: 24 }}
                >
                  {item.qty}×
                </span>
                <span
                  className="font-body text-ink-secondary flex-1"
                  style={{ fontSize: 13 }}
                >
                  {item.name}
                </span>
                <span
                  className="font-kds text-ink-tertiary"
                  style={{ fontSize: 13 }}
                >
                  {formatCurrency(item.qty * item.price)}
                </span>
              </div>
            ))}
            {order.notes && (
              <div
                className="font-body text-ink-disabled mt-2"
                style={{
                  fontSize: 11,
                  padding: "6px 10px",
                  background: "var(--s3)",
                  borderRadius: 6,
                }}
              >
                Nota: {order.notes}
              </div>
            )}
          </div>
        )}

        {/* Advance status button */}
        {next && (
          <button
            className="btn-primary w-full justify-center mt-3"
            style={{ paddingTop: 10, paddingBottom: 10, fontSize: 11 }}
            onClick={() => onUpdateStatus(order.id, next)}
          >
            <Check size={13} />
            {NEXT_STATUS_LABEL[order.status]}
          </button>
        )}
        {order.status === "delivered" && (
          <div
            className="font-body text-ink-disabled text-center mt-3"
            style={{ fontSize: 11 }}
          >
            ✓ Entregado
          </div>
        )}
      </div>
    </div>
  );
}

// ─── New delivery form ────────────────────────────────────────────────────────

interface DeliveryDraft {
  customerName: string;
  address: string;
  phone: string;
  paymentMethod: string;
  notes: string;
}

const emptyDeliveryDraft = (): DeliveryDraft => ({
  customerName: "",
  address: "",
  phone: "",
  paymentMethod: "cash",
  notes: "",
});

function NewDeliveryForm({
  onSave,
  onCancel,
  saving,
}: {
  onSave: (d: DeliveryDraft) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<DeliveryDraft>(emptyDeliveryDraft());

  return (
    <div
      className="card-sm animate-slide-up"
      style={{ padding: 20, marginBottom: 16 }}
    >
      <div
        className="font-display text-ink-disabled uppercase mb-4"
        style={{ fontSize: 10, letterSpacing: "0.25em" }}
      >
        Nuevo pedido delivery
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <label
            className="font-display text-ink-disabled uppercase block mb-1"
            style={{ fontSize: 9, letterSpacing: "0.2em" }}
          >
            Cliente
          </label>
          <input
            className="input-base"
            value={draft.customerName}
            onChange={(e) => setDraft({ ...draft, customerName: e.target.value })}
            placeholder="Nombre del cliente"
          />
        </div>
        <div>
          <label
            className="font-display text-ink-disabled uppercase block mb-1"
            style={{ fontSize: 9, letterSpacing: "0.2em" }}
          >
            Teléfono
          </label>
          <input
            className="input-base"
            value={draft.phone}
            onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            placeholder="+54 9 ..."
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label
            className="font-display text-ink-disabled uppercase block mb-1"
            style={{ fontSize: 9, letterSpacing: "0.2em" }}
          >
            Dirección
          </label>
          <input
            className="input-base"
            value={draft.address}
            onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            placeholder="Calle y número"
          />
        </div>
        <div>
          <label
            className="font-display text-ink-disabled uppercase block mb-1"
            style={{ fontSize: 9, letterSpacing: "0.2em" }}
          >
            Pago
          </label>
          <select
            className="input-base"
            value={draft.paymentMethod}
            onChange={(e) =>
              setDraft({ ...draft, paymentMethod: e.target.value })
            }
            style={{ cursor: "pointer" }}
          >
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="mercadopago">MercadoPago</option>
          </select>
        </div>
        <div>
          <label
            className="font-display text-ink-disabled uppercase block mb-1"
            style={{ fontSize: 9, letterSpacing: "0.2em" }}
          >
            Notas
          </label>
          <input
            className="input-base"
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            placeholder="Instrucciones especiales"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <button
          className="btn-primary"
          onClick={() => onSave(draft)}
          disabled={saving || !draft.customerName || !draft.address}
        >
          <Check size={14} />
          {saving ? "Creando..." : "Crear pedido"}
        </button>
        <button className="btn-ghost" onClick={onCancel}>
          <X size={14} />
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DeliveryPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "all">(
    "all",
  );
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await apiFetch<DeliveryOrder[]>("/api/delivery");
      setOrders(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 10000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const updateStatus = async (id: string, status: DeliveryStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o)),
    );
    try {
      await apiFetch(`/api/delivery/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      console.error(e);
      await fetchOrders();
    }
  };

  const createOrder = async (draft: DeliveryDraft) => {
    setSaving(true);
    try {
      await apiFetch("/api/delivery", {
        method: "POST",
        body: JSON.stringify({
          customerName: draft.customerName,
          address: draft.address,
          phone: draft.phone || null,
          paymentMethod: draft.paymentMethod,
          notes: draft.notes || null,
          items: [],
        }),
      });
      setShowForm(false);
      await fetchOrders();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const filtered =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  const statuses: (DeliveryStatus | "all")[] = [
    "all",
    "pending",
    "preparing",
    "on_the_way",
    "delivered",
  ];

  return (
    <div className="min-h-screen bg-surface-0" style={{ display: "flex" }}>
      <AdminSidebar />

      <div
        style={{ marginLeft: 220, flex: 1, minHeight: "100vh", padding: 28 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1
              className="font-display text-ink-primary"
              style={{ fontSize: 20, fontWeight: 700 }}
            >
              Delivery
            </h1>
            <div
              className="font-body text-ink-disabled mt-1"
              style={{ fontSize: 12 }}
            >
              Pedidos a domicilio
            </div>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={14} />
            Nuevo pedido
          </button>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {statuses.map((s) => {
            const color =
              s === "all" ? "#f59e0b" : (STATUS_COLORS[s] ?? "#666");
            const isActive = statusFilter === s;
            const count =
              s === "all"
                ? orders.length
                : orders.filter((o) => o.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: isActive
                    ? `1px solid ${color}40`
                    : "1px solid var(--s3)",
                  background: isActive ? `${color}15` : "transparent",
                  color: isActive ? color : "#555",
                  fontFamily: "var(--font-syne)",
                  fontWeight: 600,
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {s === "all" ? "Todos" : STATUS_LABELS[s as DeliveryStatus]}
                {count > 0 && (
                  <span
                    style={{
                      background: isActive ? color : "#333",
                      color: isActive ? "#080808" : "#888",
                      borderRadius: 99,
                      padding: "0 5px",
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* New order form */}
        {showForm && (
          <NewDeliveryForm
            onSave={createOrder}
            onCancel={() => setShowForm(false)}
            saving={saving}
          />
        )}

        {/* Orders */}
        {filtered.length === 0 ? (
          <div
            className="text-center py-16 text-ink-disabled font-body"
            style={{ fontSize: 13 }}
          >
            No hay pedidos delivery{statusFilter !== "all" ? " con este estado" : ""}
          </div>
        ) : (
          <div style={{ maxWidth: 680 }}>
            {filtered.map((order) => (
              <DeliveryCard
                key={order.id}
                order={order}
                onUpdateStatus={updateStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
