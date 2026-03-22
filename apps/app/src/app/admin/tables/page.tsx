"use client";

import { useState, useEffect, useCallback } from "react";
import QRCodeSVG from "react-qr-code";
import JSZip from "jszip";
import {
	Trash2,
	Download,
	ChevronDown,
	ChevronUp,
	Plus,
	Loader2,
	QrCode,
	LayoutGrid,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Zone {
	id: string;
	name: string;
	order: number;
}

interface Table {
	id: string;
	number: number;
	zoneId: string;
	zone: Zone;
	type: string;
	status: string;
	seats: number;
}

// ─── QR URL helper ────────────────────────────────────────────────────────────

function qrUrl(tableId: string, tableNumber: number): string {
	return `https://myway-pi.vercel.app/customer/menu?tableId=${tableId}&table=${tableNumber}`;
}

// ─── Download single QR as PNG ────────────────────────────────────────────────

function downloadQR(tableNumber: number, tableId: string): void {
	const svg = document.getElementById(`qr-${tableId}`) as SVGElement | null;
	if (!svg) return;

	const canvas = document.createElement("canvas");
	const size = 400;
	canvas.width = size;
	canvas.height = size + 40;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	const img = new Image();
	const svgData = new XMLSerializer().serializeToString(svg);
	const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
	const url = URL.createObjectURL(svgBlob);

	img.onload = () => {
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, size, size + 40);
		ctx.drawImage(img, 40, 20, size - 80, size - 80);
		ctx.fillStyle = "#000";
		ctx.font = "bold 26px sans-serif";
		ctx.textAlign = "center";
		ctx.fillText(`Mesa ${tableNumber}`, size / 2, size - 10);
		URL.revokeObjectURL(url);
		const link = document.createElement("a");
		link.download = `mesa-${tableNumber}.png`;
		link.href = canvas.toDataURL("image/png");
		link.click();
	};
	img.src = url;
}

// ─── Download all QRs as ZIP ──────────────────────────────────────────────────

async function downloadAllQRs(
	tables: Table[],
	onProgress: (msg: string) => void,
): Promise<void> {
	const zip = new JSZip();
	const folder = zip.folder("qr-mesas")!;

	for (let i = 0; i < tables.length; i++) {
		const table = tables[i];
		onProgress(`Generando ${i + 1}/${tables.length}…`);

		const svg = document.getElementById(`qr-${table.id}`) as SVGElement | null;
		if (!svg) continue;

		await new Promise<void>((resolve) => {
			const canvas = document.createElement("canvas");
			const size = 400;
			canvas.width = size;
			canvas.height = size + 40;
			const ctx = canvas.getContext("2d")!;
			const img = new Image();
			const svgData = new XMLSerializer().serializeToString(svg);
			const blob = new Blob([svgData], { type: "image/svg+xml" });
			const url = URL.createObjectURL(blob);

			img.onload = () => {
				ctx.fillStyle = "white";
				ctx.fillRect(0, 0, size, size + 40);
				ctx.drawImage(img, 40, 20, size - 80, size - 80);
				ctx.fillStyle = "#000";
				ctx.font = "bold 26px sans-serif";
				ctx.textAlign = "center";
				ctx.fillText(
					`Mesa ${table.number} — ${table.zone?.name ?? ""}`,
					size / 2,
					size - 10,
				);
				URL.revokeObjectURL(url);
				canvas.toBlob((b) => {
					if (b) {
						const zoneName = (table.zone?.name ?? "zona")
							.toLowerCase()
							.replace(/\s+/g, "-");
						folder.file(`mesa-${table.number}-${zoneName}.png`, b);
					}
					resolve();
				});
			};
			img.src = url;
		});
	}

	onProgress("Comprimiendo ZIP…");
	const blob = await zip.generateAsync({ type: "blob" });
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = "qr-mesas.zip";
	link.click();
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({ label, value }: { label: string; value: number | string }) {
	return (
		<div
			style={{
				background: "var(--s2)",
				border: "1px solid var(--s3)",
				borderRadius: 12,
				padding: "10px 18px",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: 2,
				minWidth: 90,
			}}
		>
			<span
				className="font-kds text-brand-500"
				style={{ fontSize: 28, lineHeight: 1 }}
			>
				{value}
			</span>
			<span
				className="font-display text-ink-tertiary uppercase"
				style={{ fontSize: 9, letterSpacing: "0.2em" }}
			>
				{label}
			</span>
		</div>
	);
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
	const map: Record<string, { label: string; color: string; bg: string }> = {
		available: {
			label: "Libre",
			color: "var(--color-available)",
			bg: "rgba(16,185,129,0.12)",
		},
		occupied: {
			label: "Ocupada",
			color: "var(--color-occupied)",
			bg: "rgba(245,158,11,0.12)",
		},
		reserved: {
			label: "Reservada",
			color: "var(--color-reserved)",
			bg: "rgba(139,92,246,0.12)",
		},
	};
	const s = map[status] ?? {
		label: status,
		color: "#6b7280",
		bg: "rgba(107,114,128,0.12)",
	};
	return (
		<span
			style={{
				background: s.bg,
				color: s.color,
				border: `1px solid ${s.color}33`,
				borderRadius: 99,
				fontSize: 9,
				fontFamily: "var(--font-syne)",
				fontWeight: 700,
				letterSpacing: "0.15em",
				padding: "2px 8px",
				textTransform: "uppercase",
			}}
		>
			{s.label}
		</span>
	);
}

// ─── Table card ───────────────────────────────────────────────────────────────

function TableCard({
	table,
	onDelete,
}: {
	table: Table;
	onDelete: (id: string) => void;
}) {
	const [confirmDelete, setConfirmDelete] = useState(false);

	const handleDelete = () => {
		if (!confirmDelete) {
			setConfirmDelete(true);
			setTimeout(() => setConfirmDelete(false), 3000);
			return;
		}
		onDelete(table.id);
	};

	return (
		<div
			className="card"
			style={{
				padding: "14px",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: 10,
				position: "relative",
			}}
		>
			{/* Table number */}
			<div
				className="font-kds text-brand-500"
				style={{ fontSize: 36, lineHeight: 1 }}
			>
				{table.number}
			</div>

			{/* Seats + status */}
			<div className="flex items-center gap-2 flex-wrap justify-center">
				<span className="font-body text-ink-tertiary" style={{ fontSize: 10 }}>
					{table.seats} sillas
				</span>
				<StatusBadge status={table.status} />
			</div>

			{/* QR Code */}
			<div
				style={{
					background: "white",
					padding: 8,
					borderRadius: 8,
					display: "inline-block",
					lineHeight: 0,
				}}
			>
				<QRCodeSVG
					id={`qr-${table.id}`}
					value={qrUrl(table.id, table.number)}
					size={100}
					bgColor="white"
					fgColor="#080808"
					level="M"
				/>
			</div>

			{/* Actions */}
			<div className="flex items-center gap-2">
				<button
					className="btn-ghost"
					style={{ padding: "6px 10px", fontSize: 11, gap: 4 }}
					onClick={() => downloadQR(table.number, table.id)}
					title="Descargar QR como PNG"
				>
					<Download size={12} />
					PNG
				</button>
				<button
					onClick={handleDelete}
					style={{
						padding: "6px 10px",
						fontSize: 11,
						borderRadius: 8,
						border: confirmDelete
							? "1px solid rgba(239,68,68,0.5)"
							: "1px solid var(--s4)",
						background: confirmDelete ? "rgba(239,68,68,0.15)" : "transparent",
						color: confirmDelete ? "#ef4444" : "#666",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						gap: 4,
						transition: "all 0.2s",
					}}
					title={confirmDelete ? "Confirmar eliminación" : "Eliminar mesa"}
				>
					<Trash2 size={12} />
					{confirmDelete ? "¿Seguro?" : ""}
				</button>
			</div>
		</div>
	);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminTablesPage() {
	const [tables, setTables] = useState<Table[]>([]);
	const [zones, setZones] = useState<Zone[]>([]);
	const [loading, setLoading] = useState(true);
	const [bulkOpen, setBulkOpen] = useState(false);

	// Bulk create form state
	const [selectedZoneId, setSelectedZoneId] = useState("");
	const [newZoneName, setNewZoneName] = useState("");
	const [tableCount, setTableCount] = useState(10);
	const [startNumber, setStartNumber] = useState(1);
	const [seats, setSeats] = useState(4);
	const [creating, setCreating] = useState(false);
	const [createProgress, setCreateProgress] = useState("");

	// ZIP download state
	const [downloading, setDownloading] = useState(false);
	const [downloadProgress, setDownloadProgress] = useState("");

	// ── Fetch data ──────────────────────────────────────────────────────────

	const fetchAll = useCallback(async () => {
		try {
			setLoading(true);
			const [tablesRes, zonesRes] = await Promise.all([
				fetch("/api/tables"),
				fetch("/api/zones"),
			]);
			if (tablesRes.ok) setTables((await tablesRes.json()) as Table[]);
			if (zonesRes.ok) {
				const z = (await zonesRes.json()) as Zone[];
				setZones(z);
				if (z.length > 0 && !selectedZoneId) setSelectedZoneId(z[0].id);
			}
		} finally {
			setLoading(false);
		}
	}, [selectedZoneId]);

	useEffect(() => {
		void fetchAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Auto-compute start number from last table
	useEffect(() => {
		if (tables.length > 0) {
			const maxNum = Math.max(...tables.map((t) => t.number));
			setStartNumber(maxNum + 1);
		} else {
			setStartNumber(1);
		}
	}, [tables]);

	// ── Create zone ─────────────────────────────────────────────────────────

	const createZone = async (): Promise<Zone | null> => {
		if (!newZoneName.trim()) return null;
		const res = await fetch("/api/zones", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: newZoneName.trim() }),
		});
		if (!res.ok) return null;
		const zone = (await res.json()) as Zone;
		setZones((prev) => [...prev, zone]);
		setNewZoneName("");
		setSelectedZoneId(zone.id);
		return zone;
	};

	// ── Bulk create tables ──────────────────────────────────────────────────

	const handleBulkCreate = async () => {
		let zoneId = selectedZoneId;

		// If new zone name provided, create the zone first
		if (newZoneName.trim()) {
			const zone = await createZone();
			if (!zone) {
				setCreateProgress("Error al crear la zona.");
				return;
			}
			zoneId = zone.id;
		}

		if (!zoneId) {
			setCreateProgress("Seleccioná una zona.");
			return;
		}

		setCreating(true);
		setCreateProgress("");

		const created: Table[] = [];
		for (let i = 0; i < tableCount; i++) {
			const num = startNumber + i;
			setCreateProgress(`Creando mesa ${i + 1}/${tableCount}…`);
			const res = await fetch("/api/tables", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ number: num, zoneId, seats, type: "bar" }),
			});
			if (res.ok) {
				const t = (await res.json()) as Table;
				created.push(t);
			}
		}

		setTables((prev) => [...prev, ...created]);
		setCreateProgress(`Listo. ${created.length} mesas creadas.`);
		setCreating(false);
	};

	// ── Delete table ────────────────────────────────────────────────────────

	const handleDelete = async (id: string) => {
		const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
		if (res.ok) {
			setTables((prev) => prev.filter((t) => t.id !== id));
		}
	};

	// ── Download all QRs ────────────────────────────────────────────────────

	const handleDownloadAll = async () => {
		setDownloading(true);
		setDownloadProgress("Iniciando…");
		await downloadAllQRs(tables, (msg) => setDownloadProgress(msg));
		setDownloadProgress("ZIP descargado.");
		setDownloading(false);
	};

	// ── Group tables by zone ─────────────────────────────────────────────────

	const tablesByZone = zones
		.map((zone) => ({
			zone,
			tables: tables.filter((t) => t.zoneId === zone.id),
		}))
		.filter((g) => g.tables.length > 0);

	// Tables without a known zone
	const orphanTables = tables.filter(
		(t) => !zones.find((z) => z.id === t.zoneId),
	);

	// ── Render ───────────────────────────────────────────────────────────────

	return (
		<div style={{ padding: "24px 24px 60px" }}>
			{/* ── Header ── */}
			<div className="flex items-start justify-between flex-wrap gap-4 mb-8">
				<div>
					<h1
						className="font-kds text-ink-primary"
						style={{ fontSize: 40, lineHeight: 1, letterSpacing: "0.06em" }}
					>
						MESAS & QR
					</h1>
					<p
						className="font-body text-ink-tertiary mt-1"
						style={{ fontSize: 13 }}
					>
						Gestión de mesas y códigos QR para clientes
					</p>
				</div>

				{/* Stats */}
				<div className="flex items-center gap-3 flex-wrap">
					<StatPill label="Mesas" value={tables.length} />
					<StatPill label="Zonas" value={zones.length} />
				</div>
			</div>

			{/* ── Bulk Creation Panel ── */}
			<div className="card mb-6" style={{ padding: 0, overflow: "hidden" }}>
				{/* Collapsible header */}
				<button
					onClick={() => setBulkOpen((v) => !v)}
					className="w-full flex items-center justify-between"
					style={{
						padding: "16px 20px",
						background: "transparent",
						border: "none",
						cursor: "pointer",
						color: "inherit",
					}}
				>
					<div className="flex items-center gap-3">
						<Plus size={16} className="text-brand-500" />
						<span
							className="font-display text-ink-primary uppercase"
							style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em" }}
						>
							Crear mesas en lote
						</span>
					</div>
					{bulkOpen ? (
						<ChevronUp size={16} className="text-ink-tertiary" />
					) : (
						<ChevronDown size={16} className="text-ink-tertiary" />
					)}
				</button>

				{bulkOpen && (
					<div
						style={{
							padding: "0 20px 20px",
							borderTop: "1px solid var(--s3)",
						}}
					>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
								gap: 16,
								marginTop: 16,
							}}
						>
							{/* Zone selector */}
							<div>
								<label
									className="font-display text-ink-tertiary uppercase"
									style={{
										fontSize: 9,
										letterSpacing: "0.2em",
										display: "block",
										marginBottom: 6,
									}}
								>
									Zona existente
								</label>
								<select
									value={selectedZoneId}
									onChange={(e) => setSelectedZoneId(e.target.value)}
									style={{
										width: "100%",
										padding: "9px 12px",
										background: "var(--s2)",
										border: "1px solid var(--s4)",
										borderRadius: 10,
										color: "#f5f5f5",
										fontSize: 13,
										outline: "none",
									}}
								>
									<option value="">— sin zona —</option>
									{zones.map((z) => (
										<option key={z.id} value={z.id}>
											{z.name}
										</option>
									))}
								</select>
							</div>

							{/* New zone name */}
							<div>
								<label
									className="font-display text-ink-tertiary uppercase"
									style={{
										fontSize: 9,
										letterSpacing: "0.2em",
										display: "block",
										marginBottom: 6,
									}}
								>
									Nueva zona (opcional)
								</label>
								<input
									type="text"
									placeholder="ej. Terraza"
									value={newZoneName}
									onChange={(e) => setNewZoneName(e.target.value)}
									style={{
										width: "100%",
										padding: "9px 12px",
										background: "var(--s2)",
										border: "1px solid var(--s4)",
										borderRadius: 10,
										color: "#f5f5f5",
										fontSize: 13,
										outline: "none",
									}}
								/>
							</div>

							{/* Table count */}
							<div>
								<label
									className="font-display text-ink-tertiary uppercase"
									style={{
										fontSize: 9,
										letterSpacing: "0.2em",
										display: "block",
										marginBottom: 6,
									}}
								>
									Cantidad de mesas
								</label>
								<input
									type="number"
									min={1}
									max={50}
									value={tableCount}
									onChange={(e) =>
										setTableCount(
											Math.min(50, Math.max(1, Number(e.target.value))),
										)
									}
									style={{
										width: "100%",
										padding: "9px 12px",
										background: "var(--s2)",
										border: "1px solid var(--s4)",
										borderRadius: 10,
										color: "#f5f5f5",
										fontSize: 13,
										outline: "none",
									}}
								/>
							</div>

							{/* Start number */}
							<div>
								<label
									className="font-display text-ink-tertiary uppercase"
									style={{
										fontSize: 9,
										letterSpacing: "0.2em",
										display: "block",
										marginBottom: 6,
									}}
								>
									Número inicial
								</label>
								<input
									type="number"
									min={1}
									value={startNumber}
									onChange={(e) =>
										setStartNumber(Math.max(1, Number(e.target.value)))
									}
									style={{
										width: "100%",
										padding: "9px 12px",
										background: "var(--s2)",
										border: "1px solid var(--s4)",
										borderRadius: 10,
										color: "#f5f5f5",
										fontSize: 13,
										outline: "none",
									}}
								/>
							</div>

							{/* Seats */}
							<div>
								<label
									className="font-display text-ink-tertiary uppercase"
									style={{
										fontSize: 9,
										letterSpacing: "0.2em",
										display: "block",
										marginBottom: 6,
									}}
								>
									Sillas por mesa
								</label>
								<input
									type="number"
									min={1}
									max={20}
									value={seats}
									onChange={(e) =>
										setSeats(Math.max(1, Number(e.target.value)))
									}
									style={{
										width: "100%",
										padding: "9px 12px",
										background: "var(--s2)",
										border: "1px solid var(--s4)",
										borderRadius: 10,
										color: "#f5f5f5",
										fontSize: 13,
										outline: "none",
									}}
								/>
							</div>
						</div>

						{/* Submit row */}
						<div className="flex items-center gap-4 mt-5 flex-wrap">
							<button
								className="btn-primary"
								onClick={handleBulkCreate}
								disabled={creating}
								style={{ padding: "10px 24px" }}
							>
								{creating ? (
									<Loader2 size={14} className="animate-spin" />
								) : (
									<Plus size={14} />
								)}
								{creating ? "Creando…" : "CREAR MESAS"}
							</button>
							{createProgress && (
								<span
									className="font-body text-ink-tertiary"
									style={{ fontSize: 12 }}
								>
									{createProgress}
								</span>
							)}
						</div>
					</div>
				)}
			</div>

			{/* ── Download All QRs ── */}
			{tables.length > 0 && (
				<div className="flex items-center gap-4 mb-8 flex-wrap">
					<button
						className="btn-primary"
						onClick={handleDownloadAll}
						disabled={downloading}
						style={{ padding: "10px 24px" }}
					>
						{downloading ? (
							<Loader2 size={14} className="animate-spin" />
						) : (
							<QrCode size={14} />
						)}
						{downloading ? downloadProgress : "DESCARGAR TODOS LOS QR"}
					</button>
					{!downloading && downloadProgress && (
						<span
							className="font-body text-ink-tertiary"
							style={{ fontSize: 12 }}
						>
							{downloadProgress}
						</span>
					)}
				</div>
			)}

			{/* ── Loading state ── */}
			{loading && (
				<div className="flex items-center gap-3 py-12 justify-center">
					<Loader2 size={20} className="animate-spin text-brand-500" />
					<span className="font-body text-ink-tertiary text-sm">
						Cargando mesas…
					</span>
				</div>
			)}

			{/* ── Empty state ── */}
			{!loading && tables.length === 0 && (
				<div
					className="card flex flex-col items-center justify-center gap-4"
					style={{ padding: "60px 32px" }}
				>
					<LayoutGrid size={40} className="text-ink-disabled" />
					<p
						className="font-display text-ink-tertiary uppercase"
						style={{ fontSize: 12, letterSpacing: "0.2em" }}
					>
						No hay mesas creadas
					</p>
					<p className="font-body text-ink-disabled text-sm text-center">
						Usá el panel de creación para agregar mesas con sus QR codes.
					</p>
				</div>
			)}

			{/* ── Zone-grouped table list ── */}
			{!loading &&
				tablesByZone.map(({ zone, tables: zoneTables }) => (
					<div key={zone.id} className="mb-10">
						{/* Zone header */}
						<div
							className="flex items-center gap-3 mb-4"
							style={{ borderBottom: "1px solid var(--s3)", paddingBottom: 10 }}
						>
							<h2
								className="font-display text-ink-primary uppercase"
								style={{
									fontSize: 12,
									fontWeight: 700,
									letterSpacing: "0.25em",
								}}
							>
								{zone.name}
							</h2>
							<span
								style={{
									background: "var(--gold-dim)",
									color: "var(--gold)",
									border: "1px solid rgba(245,158,11,0.2)",
									borderRadius: 99,
									fontSize: 9,
									fontFamily: "var(--font-syne)",
									fontWeight: 700,
									padding: "2px 8px",
								}}
							>
								{zoneTables.length} mesa{zoneTables.length !== 1 ? "s" : ""}
							</span>
						</div>

						{/* Table grid */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
								gap: 12,
							}}
						>
							{zoneTables.map((table) => (
								<TableCard
									key={table.id}
									table={table}
									onDelete={handleDelete}
								/>
							))}
						</div>
					</div>
				))}

			{/* ── Orphan tables (no zone match) ── */}
			{!loading && orphanTables.length > 0 && (
				<div className="mb-10">
					<div
						className="flex items-center gap-3 mb-4"
						style={{ borderBottom: "1px solid var(--s3)", paddingBottom: 10 }}
					>
						<h2
							className="font-display text-ink-tertiary uppercase"
							style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.25em" }}
						>
							Sin zona
						</h2>
					</div>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
							gap: 12,
						}}
					>
						{orphanTables.map((table) => (
							<TableCard key={table.id} table={table} onDelete={handleDelete} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}
