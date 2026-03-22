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
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import type { Staff, StaffRole } from "@/lib/types";
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

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<StaffRole, string> = {
  waiter: "Mozo",
  bar: "Bartender",
  kitchen: "Cocina",
  cashier: "Cajero",
  admin: "Admin",
};

const ROLE_COLORS: Record<StaffRole, string> = {
  waiter: "#10b981",
  bar: "#3b82f6",
  kitchen: "#f59e0b",
  cashier: "#8b5cf6",
  admin: "#ef4444",
};

const ALL_ROLES: StaffRole[] = ["waiter", "bar", "kitchen", "cashier", "admin"];

// ─── Staff form ───────────────────────────────────────────────────────────────

interface StaffDraft {
  name: string;
  role: StaffRole;
  avatar: string;
}

const emptyDraft = (): StaffDraft => ({
  name: "",
  role: "waiter",
  avatar: "",
});

function StaffForm({
  draft,
  onChange,
  onSave,
  onCancel,
  saving,
  editId,
}: {
  draft: StaffDraft;
  onChange: (d: StaffDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  editId: string | null;
}) {
  const initials = draft.name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="card-sm animate-slide-up"
      style={{ padding: 20, marginBottom: 16 }}
    >
      <div
        className="font-display text-ink-disabled uppercase mb-4"
        style={{ fontSize: 10, letterSpacing: "0.25em" }}
      >
        {editId ? "Editar empleado" : "Nuevo empleado"}
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div>
          <label
            className="font-display text-ink-disabled uppercase block mb-1"
            style={{ fontSize: 9, letterSpacing: "0.2em" }}
          >
            Nombre
          </label>
          <input
            className="input-base"
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            placeholder="Ej: Juan Pérez"
          />
        </div>
        <div>
          <label
            className="font-display text-ink-disabled uppercase block mb-1"
            style={{ fontSize: 9, letterSpacing: "0.2em" }}
          >
            Rol
          </label>
          <select
            className="input-base"
            value={draft.role}
            onChange={(e) =>
              onChange({ ...draft, role: e.target.value as StaffRole })
            }
            style={{ cursor: "pointer" }}
          >
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="font-display text-ink-disabled uppercase block mb-1"
            style={{ fontSize: 9, letterSpacing: "0.2em" }}
          >
            Avatar (URL o emoji)
          </label>
          <input
            className="input-base"
            value={draft.avatar}
            onChange={(e) => onChange({ ...draft, avatar: e.target.value })}
            placeholder={initials || "👤"}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <button
          className="btn-primary"
          onClick={onSave}
          disabled={saving || !draft.name}
        >
          <Check size={14} />
          {saving ? "Guardando..." : editId ? "Guardar cambios" : "Crear empleado"}
        </button>
        <button className="btn-ghost" onClick={onCancel}>
          <X size={14} />
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Staff avatar ─────────────────────────────────────────────────────────────

function StaffAvatar({
  staff,
  size = 40,
}: {
  staff: Staff;
  size?: number;
}) {
  const color = ROLE_COLORS[staff.role];
  const initials = staff.name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isUrl =
    staff.avatar.startsWith("http") || staff.avatar.startsWith("/");

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `${color}20`,
        border: `2px solid ${color}40`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
        fontSize: size * 0.35,
      }}
    >
      {isUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={staff.avatar}
          alt={staff.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : staff.avatar ? (
        staff.avatar
      ) : (
        <span
          style={{
            fontFamily: "var(--font-syne)",
            fontWeight: 700,
            fontSize: size * 0.3,
            color,
          }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [roleFilter, setRoleFilter] = useState<StaffRole | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<StaffDraft>(emptyDraft());
  const [saving, setSaving] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      const data = await apiFetch<Staff[]>("/api/staff");
      setStaff(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const openNew = () => {
    setEditId(null);
    setDraft(emptyDraft());
    setShowForm(true);
  };

  const openEdit = (s: Staff) => {
    setEditId(s.id);
    setDraft({ name: s.name, role: s.role, avatar: s.avatar });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        name: draft.name,
        role: draft.role,
        avatar: draft.avatar || draft.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
      };
      if (editId) {
        await apiFetch(`/api/staff/${editId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/api/staff", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setShowForm(false);
      setEditId(null);
      await fetchStaff();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const deleteStaff = async (id: string) => {
    if (!confirm("¿Eliminar este empleado?")) return;
    try {
      await apiFetch(`/api/staff/${id}`, { method: "DELETE" });
      setStaff((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const filtered =
    roleFilter === "all" ? staff : staff.filter((s) => s.role === roleFilter);

  const countByRole = (role: StaffRole) =>
    staff.filter((s) => s.role === role).length;

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
              Personal
            </h1>
            <div
              className="font-body text-ink-disabled mt-1"
              style={{ fontSize: 12 }}
            >
              Gestión de empleados
            </div>
          </div>
          <button className="btn-primary" onClick={openNew}>
            <Plus size={14} />
            Nuevo empleado
          </button>
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <button
            onClick={() => setRoleFilter("all")}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border:
                roleFilter === "all"
                  ? "1px solid rgba(245,158,11,0.3)"
                  : "1px solid var(--s3)",
              background:
                roleFilter === "all" ? "rgba(245,158,11,0.1)" : "transparent",
              color: roleFilter === "all" ? "#f59e0b" : "#555",
              fontFamily: "var(--font-syne)",
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Todos ({staff.length})
          </button>
          {ALL_ROLES.map((role) => {
            const color = ROLE_COLORS[role];
            const isActive = roleFilter === role;
            return (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
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
                }}
              >
                {ROLE_LABELS[role]} ({countByRole(role)})
              </button>
            );
          })}
        </div>

        {/* Form */}
        {showForm && (
          <StaffForm
            draft={draft}
            onChange={setDraft}
            onSave={save}
            onCancel={() => {
              setShowForm(false);
              setEditId(null);
            }}
            saving={saving}
            editId={editId}
          />
        )}

        {/* Staff grid */}
        {filtered.length === 0 ? (
          <div
            className="text-center py-16 text-ink-disabled font-body"
            style={{ fontSize: 13 }}
          >
            No hay empleados en esta categoría
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
          >
            {filtered.map((s) => {
              const color = ROLE_COLORS[s.role];
              return (
                <div
                  key={s.id}
                  className="card-sm animate-fade-in"
                  style={{ padding: 20 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <StaffAvatar staff={s} size={44} />
                    <div style={{ flex: 1 }}>
                      <div
                        className="font-body text-ink-primary"
                        style={{ fontSize: 15, fontWeight: 600 }}
                      >
                        {s.name}
                      </div>
                      <span
                        style={{
                          fontSize: 9,
                          padding: "2px 8px",
                          borderRadius: 99,
                          fontFamily: "var(--font-syne)",
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color,
                          background: `${color}15`,
                          border: `1px solid ${color}30`,
                        }}
                      >
                        {ROLE_LABELS[s.role]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn-ghost flex-1 justify-center"
                      style={{ fontSize: 11, padding: "7px 0" }}
                      onClick={() => openEdit(s)}
                    >
                      <Pencil size={12} />
                      Editar
                    </button>
                    <button
                      className="btn-ghost"
                      style={{
                        padding: "7px 10px",
                        color: "#ef4444",
                      }}
                      onClick={() => deleteStaff(s.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
