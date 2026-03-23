"use client";

import { useState, useEffect, useCallback } from "react";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";
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
	MapPin,
} from "lucide-react";

// --- Types ---

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

// --- QR URL helper ---

function qrUrl(tableId: string, tableNumber: number): string {
	const base = typeof window !== "undefined" ? window.location.origin : "";
	return `${base}/customer/menu?tableId=${tableId}&table=${tableNumber}`;
}

// --- Download single QR as PNG ---

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

// --- Download all QRs as ZIP ---

async function downloadAllQRs(
	tables: Table[],
	onProgress: (msg: string) => void,
): Promise<void> {
	const zip = new JSZip();
	const folder = zip.folder("qr-mesas")!;

	for (let i = 0; i < tables.length; i++) {
		const table = tables[i];
		onProgress(`Generando ${i + 1}/${tables.length}...`);

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

	onProgress("Comprimiendo ZIP...");
	const blob = await zip.generateAsync({ type: "blob" });
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = "qr-mesas.zip";
	link.click();
}

// --- Status badge ---

function StatusBadge({ status }: { status: string }) {
	const map: Record<string, { label: string; color: string; bg: string }> = {
		available: {
			label: "Libre",
			color: "#10b981",
			bg: "rgba(16,185,129,0.12)",
		},
		occupied: {
			label: "Ocupada",
			color: "#f59e0b",
			bg: "rgba(245,158,11,0.12)",
		},
		reserved: {
			label: "Reservada",
			color: "#8b5cf6",
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

// --- Table card ---

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
			style={{
				background: "var(--s1)",
				border: "1px solid var(--s4)",
				borderRadius: 16,
				padding: 14,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: 10,
				position: "relative",
				overflow: "hidden",
				boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
			}}
		>
			{/* Subtle top glow */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: "20%",
					right: "20%",
					height: 1,
					background:
						"linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)",
				}}
			/>

			{/* Table number */}
			<div
				className="font-kds"
				style={{ fontSize: 36, lineHeight: 1, color: "#f59e0b" }}
			>
				{table.number}
			</div>

			{/* Seats + status */}
			<div className="flex items-center gap-2 flex-wrap justify-center">
				<span className="font-body" style={{ fontSize: 10, color: "#666" }}>
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
					style={{
						padding: "6px 10px",
						fontSize: 11,
						gap: 4,
						display: "flex",
						alignItems: "center",
					}}
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
					title={confirmDelete ? "Confirmar eliminacion" : "Eliminar mesa"}
				>
					<Trash2 size={12} />
					{confirmDelete ? "Seguro?" : ""}
				</button>
			</div>
		</div>
	);
}

// --- Main page ---

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

	// --- Fetch data ---

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

	// --- Create zone ---

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

	// --- Bulk create tables ---

	const handleBulkCreate = async () => {
		let zoneId = selectedZoneId;

		if (newZoneName.trim()) {
			const zone = await createZone();
			if (!zone) {
				setCreateProgress("Error al crear la zona.");
				return;
			}
			zoneId = zone.id;
		}

		if (!zoneId) {
			setCreateProgress("Selecciona una zona.");
			return;
		}

		setCreating(true);
		setCreateProgress("");

		const created: Table[] = [];
		for (let i = 0; i < tableCount; i++) {
			const num = startNumber + i;
			setCreateProgress(`Creando mesa ${i + 1}/${tableCount}...`);
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

	// --- Delete table ---

	const handleDelete = async (id: string) => {
		const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
		if (res.ok) {
			setTables((prev) => prev.filter((t) => t.id !== id));
		}
	};

	// --- Download all QRs ---

	const handleDownloadAll = async () => {
		setDownloading(true);
		setDownloadProgress("Iniciando...");
		await downloadAllQRs(tables, (msg) => setDownloadProgress(msg));
		setDownloadProgress("ZIP descargado.");
		setDownloading(false);
	};

	// --- Group tables by zone ---

	const tablesByZone = zones
		.map((zone) => ({
			zone,
			tables: tables.filter((t) => t.zoneId === zone.id),
		}))
		.filter((g) => g.tables.length > 0);

	const orphanTables = tables.filter(
		(t) => !zones.find((z) => z.id === t.zoneId),
	);

	// --- Render ---

	return (
		<div style={{ minHeight: "100vh", background: "var(--s0)" }}>
			<div
				style={{ padding: "28px 24px 48px", maxWidth: 1200, margin: "0 auto" }}
			>
				{/* --- Header --- */}
				<div
					className="flex items-center justify-between animate-fade-in"
					style={{ marginBottom: 8 }}
				>
					<div className="flex items-center gap-3">
						<div
							style={{
								width: 3,
								height: 24,
								borderRadius: 2,
								background: "var(--gold)",
							}}
						/>
						<div>
							<h1
								className="font-display"
								style={{
									fontSize: 22,
									fontWeight: 700,
									color: "#f5f5f5",
									lineHeight: 1.1,
								}}
							>
								MESAS & QR
							</h1>
							<p
								className="font-body"
								style={{ fontSize: 12, color: "#666", marginTop: 2 }}
							>
								Gestion de mesas y codigos QR para clientes
							</p>
							<HelpButton {...helpContent.tables} />
						</div>
					</div>

					{/* Stats */}
					<div className="flex items-center gap-3 flex-wrap">
						{[
							{ label: "Mesas", value: tables.length, color: "#f59e0b" },
							{ label: "Zonas", value: zones.length, color: "#3b82f6" },
						].map((stat) => (
							<div
								key={stat.label}
								style={{
									background: "var(--s1)",
									border: `1px solid ${stat.color}25`,
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
									className="font-kds"
									style={{ fontSize: 28, lineHeight: 1, color: stat.color }}
								>
									{stat.value}
								</span>
								<span
									className="font-display uppercase"
									style={{
										fontSize: 9,
										letterSpacing: "0.2em",
										color: "#888",
										fontWeight: 600,
									}}
								>
									{stat.label}
								</span>
							</div>
						))}
					</div>
				</div>
				<div className="divider-gold" style={{ marginBottom: 28 }} />

				{/* --- Bulk Creation Panel --- */}
				<div
					style={{
						background: "var(--s1)",
						border: "1px solid var(--s4)",
						borderRadius: 16,
						overflow: "hidden",
						boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
						marginBottom: 24,
					}}
				>
					{/* Collapsible header */}
					<button
						onClick={() => setBulkOpen((v) => !v)}
						className="w-full flex items-center justify-between"
						style={{
							padding: "14px 20px",
							background: "transparent",
							border: "none",
							cursor: "pointer",
							color: "inherit",
						}}
					>
						<div className="flex items-center gap-2.5">
							<Plus size={14} style={{ color: "var(--gold)" }} />
							<span
								className="font-display uppercase"
								style={{
									fontSize: 11,
									fontWeight: 600,
									letterSpacing: "0.15em",
									color: "#ccc",
								}}
							>
								Crear mesas en lote
							</span>
						</div>
						{bulkOpen ? (
							<ChevronUp size={16} style={{ color: "#555" }} />
						) : (
							<ChevronDown size={16} style={{ color: "#555" }} />
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
										className="font-display uppercase"
										style={{
											fontSize: 9,
											letterSpacing: "0.2em",
											color: "#888",
											fontWeight: 600,
											display: "block",
											marginBottom: 6,
										}}
									>
										Zona existente
									</label>
									<select
										className="input-base"
										value={selectedZoneId}
										onChange={(e) => setSelectedZoneId(e.target.value)}
										style={{ width: "100%", fontSize: 13 }}
									>
										<option value="">-- sin zona --</option>
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
										className="font-display uppercase"
										style={{
											fontSize: 9,
											letterSpacing: "0.2em",
											color: "#888",
											fontWeight: 600,
											display: "block",
											marginBottom: 6,
										}}
									>
										Nueva zona (opcional)
									</label>
									<input
										className="input-base"
										type="text"
										placeholder="ej. Terraza"
										value={newZoneName}
										onChange={(e) => setNewZoneName(e.target.value)}
										style={{ width: "100%", fontSize: 13 }}
									/>
								</div>

								{/* Table count */}
								<div>
									<label
										className="font-display uppercase"
										style={{
											fontSize: 9,
											letterSpacing: "0.2em",
											color: "#888",
											fontWeight: 600,
											display: "block",
											marginBottom: 6,
										}}
									>
										Cantidad de mesas
									</label>
									<input
										className="input-base"
										type="number"
										min={1}
										max={50}
										value={tableCount}
										onChange={(e) =>
											setTableCount(
												Math.min(50, Math.max(1, Number(e.target.value))),
											)
										}
										style={{ width: "100%", fontSize: 13 }}
									/>
								</div>

								{/* Start number */}
								<div>
									<label
										className="font-display uppercase"
										style={{
											fontSize: 9,
											letterSpacing: "0.2em",
											color: "#888",
											fontWeight: 600,
											display: "block",
											marginBottom: 6,
										}}
									>
										Numero inicial
									</label>
									<input
										className="input-base"
										type="number"
										min={1}
										value={startNumber}
										onChange={(e) =>
											setStartNumber(Math.max(1, Number(e.target.value)))
										}
										style={{ width: "100%", fontSize: 13 }}
									/>
								</div>

								{/* Seats */}
								<div>
									<label
										className="font-display uppercase"
										style={{
											fontSize: 9,
											letterSpacing: "0.2em",
											color: "#888",
											fontWeight: 600,
											display: "block",
											marginBottom: 6,
										}}
									>
										Sillas por mesa
									</label>
									<input
										className="input-base"
										type="number"
										min={1}
										max={20}
										value={seats}
										onChange={(e) =>
											setSeats(Math.max(1, Number(e.target.value)))
										}
										style={{ width: "100%", fontSize: 13 }}
									/>
								</div>
							</div>

							{/* Submit row */}
							<div
								className="flex items-center gap-4 flex-wrap"
								style={{ marginTop: 20 }}
							>
								<button
									className="btn-primary flex items-center gap-2"
									onClick={handleBulkCreate}
									disabled={creating}
									style={{ padding: "10px 24px", fontSize: 12 }}
								>
									{creating ? (
										<Loader2 size={14} className="animate-spin" />
									) : (
										<Plus size={14} />
									)}
									{creating ? "Creando..." : "CREAR MESAS"}
								</button>
								{createProgress && (
									<span
										className="font-body"
										style={{ fontSize: 12, color: "#666" }}
									>
										{createProgress}
									</span>
								)}
							</div>
						</div>
					)}
				</div>

				{/* --- Download All QRs --- */}
				{tables.length > 0 && (
					<div
						className="flex items-center gap-4 flex-wrap"
						style={{ marginBottom: 28 }}
					>
						<button
							className="btn-primary flex items-center gap-2"
							onClick={handleDownloadAll}
							disabled={downloading}
							style={{ padding: "10px 24px", fontSize: 12 }}
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
								className="font-body"
								style={{ fontSize: 12, color: "#666" }}
							>
								{downloadProgress}
							</span>
						)}
					</div>
				)}

				{/* --- Loading state --- */}
				{loading && (
					<div
						className="flex items-center gap-3 justify-center"
						style={{ padding: "48px 0" }}
					>
						<Loader2
							size={20}
							className="animate-spin"
							style={{ color: "#f59e0b" }}
						/>
						<span className="font-body" style={{ fontSize: 13, color: "#666" }}>
							Cargando mesas...
						</span>
					</div>
				)}

				{/* --- Empty state --- */}
				{!loading && tables.length === 0 && (
					<div
						style={{
							background: "var(--s1)",
							border: "1px solid var(--s4)",
							borderRadius: 16,
							padding: "60px 32px",
							textAlign: "center",
						}}
					>
						<div
							style={{
								width: 64,
								height: 64,
								borderRadius: 16,
								background: "rgba(255,255,255,0.03)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								margin: "0 auto 16px",
							}}
						>
							<LayoutGrid size={40} style={{ color: "#444" }} />
						</div>
						<p
							className="font-display uppercase"
							style={{ fontSize: 12, letterSpacing: "0.2em", color: "#888" }}
						>
							No hay mesas creadas
						</p>
						<p
							className="font-body"
							style={{ fontSize: 13, color: "#555", marginTop: 6 }}
						>
							Usa el panel de creacion para agregar mesas con sus QR codes.
						</p>
					</div>
				)}

				{/* --- Zone-grouped table list --- */}
				{!loading &&
					tablesByZone.map(({ zone, tables: zoneTables }) => (
						<div key={zone.id} style={{ marginBottom: 40 }}>
							{/* Section card header */}
							<div
								style={{
									background: "var(--s1)",
									border: "1px solid var(--s4)",
									borderRadius: 16,
									overflow: "hidden",
									boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
									marginBottom: 16,
								}}
							>
								<div
									className="flex items-center justify-between"
									style={{
										padding: "14px 20px",
										borderBottom: "1px solid var(--s3)",
										background: "var(--s2)",
									}}
								>
									<div className="flex items-center gap-2.5">
										<MapPin size={14} style={{ color: "var(--gold)" }} />
										<span
											className="font-display uppercase"
											style={{
												fontSize: 11,
												letterSpacing: "0.15em",
												color: "#ccc",
												fontWeight: 600,
											}}
										>
											{zone.name}
										</span>
									</div>
									<span
										style={{
											background: "rgba(245,158,11,0.08)",
											color: "#f59e0b",
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

								{/* Table grid inside section card */}
								<div
									style={{
										padding: 16,
										display: "grid",
										gridTemplateColumns:
											"repeat(auto-fill, minmax(160px, 1fr))",
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
						</div>
					))}

				{/* --- Orphan tables (no zone match) --- */}
				{!loading && orphanTables.length > 0 && (
					<div style={{ marginBottom: 40 }}>
						<div
							style={{
								background: "var(--s1)",
								border: "1px solid var(--s4)",
								borderRadius: 16,
								overflow: "hidden",
								boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
							}}
						>
							<div
								className="flex items-center gap-2.5"
								style={{
									padding: "14px 20px",
									borderBottom: "1px solid var(--s3)",
									background: "var(--s2)",
								}}
							>
								<LayoutGrid size={14} style={{ color: "#666" }} />
								<span
									className="font-display uppercase"
									style={{
										fontSize: 11,
										letterSpacing: "0.15em",
										color: "#888",
										fontWeight: 600,
									}}
								>
									Sin zona
								</span>
							</div>
							<div
								style={{
									padding: 16,
									display: "grid",
									gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
									gap: 12,
								}}
							>
								{orphanTables.map((table) => (
									<TableCard
										key={table.id}
										table={table}
										onDelete={handleDelete}
									/>
								))}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
