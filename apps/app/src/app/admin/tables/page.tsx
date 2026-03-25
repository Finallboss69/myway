"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";
import QRCodeSVG from "react-qr-code";
import JSZip from "jszip";
import {
	Trash2,
	Download,
	Plus,
	Loader2,
	QrCode,
	LayoutGrid,
	MapPin,
	Square,
	Circle,
	RectangleHorizontal,
	ZoomIn,
	ZoomOut,
	RotateCcw,
	X,
	Users,
	Hash,
	Maximize2,
} from "lucide-react";

// --- Types ---

type TableShape = "square" | "round" | "rect" | "pool";

interface Zone {
	id: string;
	name: string;
	order: number;
}

interface TableData {
	id: string;
	number: number;
	zoneId: string;
	zone?: Zone;
	type: string;
	status: string;
	seats: number;
	x: number;
	y: number;
	w: number;
	h: number;
	shape: TableShape;
	rotation: number;
}

// --- Constants ---

const GRID_SIZE = 20;
const CANVAS_W = 1600;
const CANVAS_H = 1000;
const DEFAULT_W = 90;
const DEFAULT_H = 70;

const STATUS_COLORS: Record<
	string,
	{ color: string; bg: string; label: string }
> = {
	available: { color: "#10b981", bg: "rgba(16,185,129,0.25)", label: "Libre" },
	occupied: { color: "#f59e0b", bg: "rgba(245,158,11,0.25)", label: "Ocupada" },
	reserved: {
		color: "#8b5cf6",
		bg: "rgba(139,92,246,0.25)",
		label: "Reservada",
	},
};

const SHAPE_LABELS: Record<TableShape, string> = {
	square: "Cuadrada",
	round: "Redonda",
	rect: "Rectangular",
	pool: "Pool",
};

// --- Helpers ---

function snapToGrid(v: number): number {
	return Math.round(v / GRID_SIZE) * GRID_SIZE;
}

function qrUrl(tableId: string, tableNumber: number): string {
	const base = typeof window !== "undefined" ? window.location.origin : "";
	return `${base}/customer/menu?tableId=${tableId}&table=${tableNumber}`;
}

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

async function downloadAllQRs(
	tables: TableData[],
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

// --- Get table visual dimensions based on shape ---

function getTableDims(table: TableData): {
	width: number;
	height: number;
	borderRadius: number | string;
	border: string;
	bg: string;
} {
	const w = table.w || DEFAULT_W;
	const h = table.h || DEFAULT_H;
	const shape = table.shape || "square";

	switch (shape) {
		case "round": {
			const d = Math.min(w, h);
			return {
				width: d,
				height: d,
				borderRadius: "50%",
				border: "2px solid rgba(245,158,11,0.4)",
				bg: "rgba(245,158,11,0.06)",
			};
		}
		case "rect":
			return {
				width: w * 1.5,
				height: h,
				borderRadius: 8,
				border: "2px solid rgba(245,158,11,0.4)",
				bg: "rgba(245,158,11,0.06)",
			};
		case "pool":
			return {
				width: w * 1.8,
				height: h * 1.2,
				borderRadius: 6,
				border: "2px solid rgba(16,185,129,0.5)",
				bg: "rgba(16,185,129,0.08)",
			};
		default: // square
			return {
				width: w,
				height: h,
				borderRadius: 8,
				border: "2px solid rgba(245,158,11,0.4)",
				bg: "rgba(245,158,11,0.06)",
			};
	}
}

// ===========================================================================
// MAIN PAGE
// ===========================================================================

export default function AdminTablesPage() {
	// --- Data state ---
	const [tables, setTables] = useState<TableData[]>([]);
	const [zones, setZones] = useState<Zone[]>([]);
	const [loading, setLoading] = useState(true);

	// --- UI state ---
	const [activeZoneId, setActiveZoneId] = useState<string>("");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [zoom, setZoom] = useState(1);
	const [addZoneOpen, setAddZoneOpen] = useState(false);
	const [newZoneName, setNewZoneName] = useState("");
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

	// --- Drag state ---
	const [dragging, setDragging] = useState<{
		tableId: string;
		offsetX: number;
		offsetY: number;
		startX: number;
		startY: number;
	} | null>(null);

	// --- Resize state ---
	const [resizing, setResizing] = useState<{
		tableId: string;
		startMouseX: number;
		startMouseY: number;
		startW: number;
		startH: number;
	} | null>(null);

	// --- Download state ---
	const [downloading, setDownloading] = useState(false);
	const [downloadProgress, setDownloadProgress] = useState("");

	// --- Refs ---
	const canvasRef = useRef<HTMLDivElement>(null);
	const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// --- Fetch data ---

	const fetchAll = useCallback(async () => {
		try {
			setLoading(true);
			const [tablesRes, zonesRes] = await Promise.all([
				fetch("/api/tables"),
				fetch("/api/zones"),
			]);
			if (tablesRes.ok) {
				const data = (await tablesRes.json()) as TableData[];
				setTables(data);
			}
			if (zonesRes.ok) {
				const z = (await zonesRes.json()) as Zone[];
				setZones(z);
				if (z.length > 0 && !activeZoneId) {
					setActiveZoneId(z[0].id);
				}
			}
		} finally {
			setLoading(false);
		}
	}, [activeZoneId]);

	useEffect(() => {
		void fetchAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// --- Computed ---

	const zoneTables = tables.filter((t) => t.zoneId === activeZoneId);
	const selectedTable = selectedId
		? (tables.find((t) => t.id === selectedId) ?? null)
		: null;

	// --- Save table position/props (debounced) ---

	const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
		new Map(),
	);

	const saveTable = useCallback((id: string, data: Partial<TableData>) => {
		const existing = saveTimers.current.get(id);
		if (existing) clearTimeout(existing);
		saveTimers.current.set(
			id,
			setTimeout(async () => {
				saveTimers.current.delete(id);
				await fetch(`/api/tables/${id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});
			}, 300),
		);
	}, []);

	// --- Update table in local state ---

	const updateTableLocal = useCallback(
		(id: string, updates: Partial<TableData>) => {
			setTables((prev) =>
				prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
			);
		},
		[],
	);

	// --- Mouse handlers for drag ---

	const handleMouseDown = useCallback(
		(e: React.MouseEvent, tableId: string) => {
			e.preventDefault();
			e.stopPropagation();

			const table = tables.find((t) => t.id === tableId);
			if (!table) return;

			setSelectedId(tableId);

			const canvasEl = canvasRef.current;
			if (!canvasEl) return;

			const rect = canvasEl.getBoundingClientRect();
			const mouseX = (e.clientX - rect.left) / zoom;
			const mouseY = (e.clientY - rect.top) / zoom;

			setDragging({
				tableId,
				offsetX: mouseX - table.x,
				offsetY: mouseY - table.y,
				startX: table.x,
				startY: table.y,
			});
		},
		[tables, zoom],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (resizing) {
				const canvasEl = canvasRef.current;
				if (!canvasEl) return;
				const rect = canvasEl.getBoundingClientRect();
				const mouseX = (e.clientX - rect.left) / zoom;
				const mouseY = (e.clientY - rect.top) / zoom;
				const dx = mouseX - resizing.startMouseX;
				const dy = mouseY - resizing.startMouseY;
				const newW = Math.max(40, snapToGrid(resizing.startW + dx));
				const newH = Math.max(40, snapToGrid(resizing.startH + dy));
				updateTableLocal(resizing.tableId, { w: newW, h: newH });
				return;
			}

			if (!dragging) return;

			const canvasEl = canvasRef.current;
			if (!canvasEl) return;

			const rect = canvasEl.getBoundingClientRect();
			const mouseX = (e.clientX - rect.left) / zoom;
			const mouseY = (e.clientY - rect.top) / zoom;

			let newX = snapToGrid(mouseX - dragging.offsetX);
			let newY = snapToGrid(mouseY - dragging.offsetY);

			// Clamp to canvas bounds
			newX = Math.max(0, Math.min(newX, CANVAS_W - 40));
			newY = Math.max(0, Math.min(newY, CANVAS_H - 40));

			updateTableLocal(dragging.tableId, { x: newX, y: newY });
		},
		[dragging, resizing, zoom, updateTableLocal],
	);

	const handleMouseUp = useCallback(() => {
		if (resizing) {
			const table = tables.find((t) => t.id === resizing.tableId);
			if (table) {
				saveTable(resizing.tableId, { w: table.w, h: table.h });
			}
			setResizing(null);
			return;
		}

		if (!dragging) return;

		const table = tables.find((t) => t.id === dragging.tableId);
		if (table) {
			saveTable(dragging.tableId, { x: table.x, y: table.y });
		}
		setDragging(null);
	}, [dragging, resizing, tables, saveTable]);

	// --- Resize handle ---

	const handleResizeStart = useCallback(
		(e: React.MouseEvent, tableId: string) => {
			e.preventDefault();
			e.stopPropagation();

			const table = tables.find((t) => t.id === tableId);
			if (!table) return;

			const canvasEl = canvasRef.current;
			if (!canvasEl) return;

			const rect = canvasEl.getBoundingClientRect();
			const mouseX = (e.clientX - rect.left) / zoom;
			const mouseY = (e.clientY - rect.top) / zoom;

			setResizing({
				tableId,
				startMouseX: mouseX,
				startMouseY: mouseY,
				startW: table.w || DEFAULT_W,
				startH: table.h || DEFAULT_H,
			});
		},
		[tables, zoom],
	);

	// --- Canvas click (deselect) ---

	const handleCanvasClick = useCallback(() => {
		if (!dragging && !resizing) {
			setSelectedId(null);
		}
	}, [dragging, resizing]);

	// --- Add table ---

	const handleAddTable = useCallback(async () => {
		if (!activeZoneId) return;

		const maxNum =
			tables.length > 0 ? Math.max(...tables.map((t) => t.number)) : 0;
		const newNumber = maxNum + 1;

		// Place near center of visible canvas
		const x = snapToGrid(CANVAS_W / 2 - DEFAULT_W / 2);
		const y = snapToGrid(CANVAS_H / 2 - DEFAULT_H / 2);

		const res = await fetch("/api/tables", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				number: newNumber,
				zoneId: activeZoneId,
				seats: 4,
				type: "bar",
				x,
				y,
				w: DEFAULT_W,
				h: DEFAULT_H,
				shape: "square",
				rotation: 0,
			}),
		});

		if (res.ok) {
			const table = (await res.json()) as TableData;
			setTables((prev) => [...prev, table]);
			setSelectedId(table.id);
		}
	}, [activeZoneId, tables]);

	// --- Delete table ---

	const handleDeleteTable = useCallback(
		async (id: string) => {
			if (confirmDeleteId !== id) {
				setConfirmDeleteId(id);
				setTimeout(() => setConfirmDeleteId(null), 3000);
				return;
			}
			const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
			if (res.ok) {
				setTables((prev) => prev.filter((t) => t.id !== id));
				if (selectedId === id) setSelectedId(null);
				setConfirmDeleteId(null);
			}
		},
		[confirmDeleteId, selectedId],
	);

	// --- Update selected table field ---

	const handleFieldChange = useCallback(
		(field: keyof TableData, value: string | number) => {
			if (!selectedId) return;
			updateTableLocal(selectedId, { [field]: value });
			saveTable(selectedId, { [field]: value });
		},
		[selectedId, updateTableLocal, saveTable],
	);

	// --- Add zone ---

	const handleAddZone = useCallback(async () => {
		if (!newZoneName.trim()) return;
		const res = await fetch("/api/zones", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: newZoneName.trim() }),
		});
		if (res.ok) {
			const zone = (await res.json()) as Zone;
			setZones((prev) => [...prev, zone]);
			setActiveZoneId(zone.id);
			setNewZoneName("");
			setAddZoneOpen(false);
		}
	}, [newZoneName]);

	// --- Download all QRs ---

	const handleDownloadAll = useCallback(async () => {
		setDownloading(true);
		setDownloadProgress("Iniciando...");
		await downloadAllQRs(tables, (msg) => setDownloadProgress(msg));
		setDownloadProgress("ZIP descargado.");
		setDownloading(false);
	}, [tables]);

	// --- Zoom ---

	const zoomIn = () => setZoom((z) => Math.min(2, z + 0.15));
	const zoomOut = () => setZoom((z) => Math.max(0.3, z - 0.15));
	const zoomReset = () => setZoom(1);

	// --- Label style ---

	const labelStyle: React.CSSProperties = {
		fontSize: 9,
		letterSpacing: "0.2em",
		color: "#888",
		fontWeight: 600,
		display: "block",
		marginBottom: 6,
		textTransform: "uppercase",
		fontFamily: "var(--font-syne)",
	};

	// ===========================================================================
	// RENDER
	// ===========================================================================

	return (
		<div style={{ minHeight: "100vh", background: "var(--s0)" }}>
			<div
				style={{
					padding: "20px 24px 48px",
					maxWidth: "100%",
					margin: "0 auto",
				}}
			>
				{/* === HEADER === */}
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
								PLANO DE MESAS
							</h1>
							<p
								className="font-body"
								style={{ fontSize: 12, color: "#666", marginTop: 2 }}
							>
								Arrastra las mesas para organizar tu salon
							</p>
							<HelpButton {...helpContent.tables} />
						</div>
					</div>

					{/* Stats */}
					<div className="flex items-center gap-3 flex-wrap">
						{[
							{ label: "Mesas", value: tables.length, color: "#f59e0b" },
							{ label: "Zonas", value: zones.length, color: "#3b82f6" },
							{
								label: "En zona",
								value: zoneTables.length,
								color: "#10b981",
							},
						].map((stat) => (
							<div
								key={stat.label}
								style={{
									background: "var(--s1)",
									border: `1px solid ${stat.color}25`,
									borderRadius: 12,
									padding: "8px 14px",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									gap: 2,
									minWidth: 70,
								}}
							>
								<span
									className="font-kds"
									style={{ fontSize: 24, lineHeight: 1, color: stat.color }}
								>
									{stat.value}
								</span>
								<span
									className="font-display uppercase"
									style={{
										fontSize: 8,
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

				<div className="divider-gold" style={{ marginBottom: 16 }} />

				{/* === ZONE TABS === */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
						marginBottom: 16,
						flexWrap: "wrap",
					}}
				>
					{zones.map((zone) => {
						const isActive = zone.id === activeZoneId;
						const count = tables.filter((t) => t.zoneId === zone.id).length;
						return (
							<button
								key={zone.id}
								onClick={() => {
									setActiveZoneId(zone.id);
									setSelectedId(null);
								}}
								style={{
									padding: "8px 18px",
									borderRadius: 10,
									border: isActive
										? "1px solid rgba(245,158,11,0.4)"
										: "1px solid var(--s4)",
									background: isActive ? "rgba(245,158,11,0.1)" : "var(--s1)",
									color: isActive ? "#f59e0b" : "#888",
									cursor: "pointer",
									fontFamily: "var(--font-syne)",
									fontSize: 11,
									fontWeight: 600,
									letterSpacing: "0.1em",
									textTransform: "uppercase",
									display: "flex",
									alignItems: "center",
									gap: 8,
									transition: "all 0.2s",
								}}
							>
								<MapPin size={12} />
								{zone.name}
								<span
									style={{
										fontSize: 9,
										opacity: 0.6,
										background: isActive
											? "rgba(245,158,11,0.15)"
											: "rgba(255,255,255,0.05)",
										padding: "1px 6px",
										borderRadius: 99,
									}}
								>
									{count}
								</span>
							</button>
						);
					})}

					{/* Add zone button */}
					{addZoneOpen ? (
						<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
							<input
								className="input-base"
								type="text"
								placeholder="Nombre de zona..."
								value={newZoneName}
								onChange={(e) => setNewZoneName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") void handleAddZone();
									if (e.key === "Escape") {
										setAddZoneOpen(false);
										setNewZoneName("");
									}
								}}
								autoFocus
								style={{ fontSize: 12, padding: "6px 12px", width: 160 }}
							/>
							<button
								className="btn-primary"
								onClick={() => void handleAddZone()}
								style={{ padding: "6px 12px", fontSize: 11 }}
							>
								Crear
							</button>
							<button
								onClick={() => {
									setAddZoneOpen(false);
									setNewZoneName("");
								}}
								style={{
									background: "transparent",
									border: "none",
									color: "#666",
									cursor: "pointer",
									padding: 4,
								}}
							>
								<X size={14} />
							</button>
						</div>
					) : (
						<button
							onClick={() => setAddZoneOpen(true)}
							style={{
								padding: "8px 14px",
								borderRadius: 10,
								border: "1px dashed var(--s4)",
								background: "transparent",
								color: "#555",
								cursor: "pointer",
								fontFamily: "var(--font-syne)",
								fontSize: 11,
								fontWeight: 600,
								display: "flex",
								alignItems: "center",
								gap: 6,
								transition: "all 0.2s",
							}}
						>
							<Plus size={12} />
							Zona
						</button>
					)}
				</div>

				{/* === LOADING === */}
				{loading && (
					<div
						className="flex items-center gap-3 justify-center"
						style={{ padding: "80px 0" }}
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

				{/* === EMPTY STATE (no zones) === */}
				{!loading && zones.length === 0 && (
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
							No hay zonas creadas
						</p>
						<p
							className="font-body"
							style={{ fontSize: 13, color: "#555", marginTop: 6 }}
						>
							Crea una zona para empezar a agregar mesas.
						</p>
					</div>
				)}

				{/* === MAIN LAYOUT: CANVAS + PANEL === */}
				{!loading && zones.length > 0 && (
					<div
						style={{
							display: "flex",
							gap: 16,
							alignItems: "flex-start",
						}}
					>
						{/* --- CANVAS AREA --- */}
						<div
							style={{
								flex: 1,
								minWidth: 0,
								background: "var(--s1)",
								border: "1px solid var(--s3)",
								borderRadius: 16,
								overflow: "hidden",
								position: "relative",
							}}
						>
							{/* Canvas toolbar */}
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									padding: "10px 16px",
									borderBottom: "1px solid var(--s3)",
									background: "var(--s2)",
								}}
							>
								<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
									<button
										className="btn-primary flex items-center gap-2"
										onClick={() => void handleAddTable()}
										style={{ padding: "6px 16px", fontSize: 11 }}
									>
										<Plus size={12} />
										Agregar Mesa
									</button>
								</div>

								<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
									{/* Download all QRs */}
									{tables.length > 0 && (
										<button
											onClick={() => void handleDownloadAll()}
											disabled={downloading}
											style={{
												padding: "6px 12px",
												borderRadius: 8,
												border: "1px solid var(--s4)",
												background: "transparent",
												color: "#888",
												cursor: "pointer",
												fontSize: 10,
												fontFamily: "var(--font-syne)",
												fontWeight: 600,
												display: "flex",
												alignItems: "center",
												gap: 4,
												letterSpacing: "0.1em",
											}}
										>
											{downloading ? (
												<Loader2 size={12} className="animate-spin" />
											) : (
												<QrCode size={12} />
											)}
											{downloading ? downloadProgress : "QR ZIP"}
										</button>
									)}

									{/* Zoom controls */}
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: 2,
											marginLeft: 8,
											background: "var(--s1)",
											borderRadius: 8,
											border: "1px solid var(--s3)",
											padding: 2,
										}}
									>
										<button
											onClick={zoomOut}
											style={{
												background: "transparent",
												border: "none",
												color: "#888",
												cursor: "pointer",
												padding: "4px 6px",
												borderRadius: 6,
											}}
											title="Alejar"
										>
											<ZoomOut size={14} />
										</button>
										<span
											style={{
												fontSize: 10,
												color: "#666",
												fontFamily: "var(--font-dm-sans)",
												padding: "0 4px",
												minWidth: 36,
												textAlign: "center",
											}}
										>
											{Math.round(zoom * 100)}%
										</span>
										<button
											onClick={zoomIn}
											style={{
												background: "transparent",
												border: "none",
												color: "#888",
												cursor: "pointer",
												padding: "4px 6px",
												borderRadius: 6,
											}}
											title="Acercar"
										>
											<ZoomIn size={14} />
										</button>
										<button
											onClick={zoomReset}
											style={{
												background: "transparent",
												border: "none",
												color: "#666",
												cursor: "pointer",
												padding: "4px 6px",
												borderRadius: 6,
											}}
											title="Reset zoom"
										>
											<RotateCcw size={12} />
										</button>
									</div>
								</div>
							</div>

							{/* Canvas scroll container */}
							<div
								style={{
									overflow: "auto",
									maxHeight: "calc(100vh - 260px)",
									minHeight: 500,
									cursor: dragging ? "grabbing" : "default",
								}}
								onMouseMove={handleMouseMove}
								onMouseUp={handleMouseUp}
								onMouseLeave={handleMouseUp}
							>
								{/* Canvas */}
								<div
									ref={canvasRef}
									onClick={handleCanvasClick}
									style={{
										width: CANVAS_W * zoom,
										height: CANVAS_H * zoom,
										position: "relative",
										backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)`,
										backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
										transition: dragging ? "none" : "background-size 0.2s",
									}}
								>
									{/* Render zone tables */}
									{zoneTables.map((table) => {
										const dims = getTableDims(table);
										const isSelected = selectedId === table.id;
										const statusInfo =
											STATUS_COLORS[table.status] ?? STATUS_COLORS.available;

										return (
											<div
												key={table.id}
												onMouseDown={(e) => handleMouseDown(e, table.id)}
												style={{
													position: "absolute",
													left: table.x * zoom,
													top: table.y * zoom,
													width: dims.width * zoom,
													height: dims.height * zoom,
													borderRadius: dims.borderRadius,
													border: isSelected
														? "2px solid #f59e0b"
														: dims.border,
													background: isSelected
														? "rgba(245,158,11,0.12)"
														: dims.bg,
													boxShadow: isSelected
														? "0 0 20px rgba(245,158,11,0.2)"
														: "0 2px 8px rgba(0,0,0,0.3)",
													cursor:
														dragging?.tableId === table.id
															? "grabbing"
															: "grab",
													display: "flex",
													flexDirection: "column",
													alignItems: "center",
													justifyContent: "center",
													gap: 2 * zoom,
													userSelect: "none",
													transition:
														dragging?.tableId === table.id
															? "none"
															: "box-shadow 0.2s, border 0.2s",
													transform: table.rotation
														? `rotate(${table.rotation}deg)`
														: undefined,
													zIndex: isSelected ? 10 : 1,
												}}
											>
												{/* Table number */}
												<span
													className="font-kds"
													style={{
														fontSize: Math.max(12, 22 * zoom),
														lineHeight: 1,
														color:
															table.shape === "pool" ? "#10b981" : "#f59e0b",
														pointerEvents: "none",
													}}
												>
													{table.number}
												</span>

												{/* Seats */}
												<span
													style={{
														fontSize: Math.max(7, 9 * zoom),
														color: "#666",
														fontFamily: "var(--font-dm-sans)",
														pointerEvents: "none",
														display: "flex",
														alignItems: "center",
														gap: 2,
													}}
												>
													<Users
														size={Math.max(6, 8 * zoom)}
														style={{ opacity: 0.5 }}
													/>
													{table.seats}
												</span>

												{/* Status dot */}
												<div
													style={{
														width: Math.max(4, 6 * zoom),
														height: Math.max(4, 6 * zoom),
														borderRadius: "50%",
														background: statusInfo.color,
														pointerEvents: "none",
													}}
												/>

												{/* Resize handle (bottom-right) */}
												{isSelected && (
													<div
														onMouseDown={(e) => handleResizeStart(e, table.id)}
														style={{
															position: "absolute",
															right: -2,
															bottom: -2,
															width: 14 * zoom,
															height: 14 * zoom,
															cursor: "nwse-resize",
															borderRadius: "0 0 4px 0",
															background: "rgba(245,158,11,0.3)",
															display: "flex",
															alignItems: "center",
															justifyContent: "center",
														}}
													>
														<Maximize2
															size={Math.max(6, 8 * zoom)}
															style={{ color: "#f59e0b" }}
														/>
													</div>
												)}
											</div>
										);
									})}

									{/* Empty zone hint */}
									{zoneTables.length === 0 && (
										<div
											style={{
												position: "absolute",
												top: "50%",
												left: "50%",
												transform: "translate(-50%, -50%)",
												textAlign: "center",
												pointerEvents: "none",
											}}
										>
											<LayoutGrid
												size={48}
												style={{ color: "#333", marginBottom: 12 }}
											/>
											<p
												className="font-display uppercase"
												style={{
													fontSize: 12,
													letterSpacing: "0.2em",
													color: "#555",
												}}
											>
												Zona vacia
											</p>
											<p
												className="font-body"
												style={{
													fontSize: 12,
													color: "#444",
													marginTop: 4,
												}}
											>
												Hace clic en &quot;Agregar Mesa&quot; para empezar
											</p>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* --- RIGHT PANEL --- */}
						<div
							style={{
								width: 280,
								flexShrink: 0,
								display: "flex",
								flexDirection: "column",
								gap: 12,
							}}
						>
							{/* Selected table properties */}
							{selectedTable ? (
								<div
									style={{
										background: "var(--s1)",
										border: "1px solid var(--s3)",
										borderRadius: 16,
										padding: 16,
										display: "flex",
										flexDirection: "column",
										gap: 14,
									}}
								>
									{/* Panel header */}
									<div
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
										}}
									>
										<span
											className="font-display uppercase"
											style={{
												fontSize: 10,
												letterSpacing: "0.2em",
												color: "#ccc",
												fontWeight: 600,
											}}
										>
											Mesa {selectedTable.number}
										</span>
										<button
											onClick={() => setSelectedId(null)}
											style={{
												background: "transparent",
												border: "none",
												color: "#666",
												cursor: "pointer",
												padding: 2,
											}}
										>
											<X size={14} />
										</button>
									</div>

									{/* Number */}
									<div>
										<label style={labelStyle}>
											<Hash
												size={8}
												style={{
													display: "inline",
													marginRight: 4,
													verticalAlign: "middle",
												}}
											/>
											Numero
										</label>
										<input
											className="input-base"
											type="number"
											min={1}
											value={selectedTable.number}
											onChange={(e) =>
												handleFieldChange(
													"number",
													Math.max(1, Number(e.target.value)),
												)
											}
											style={{ width: "100%", fontSize: 13 }}
										/>
									</div>

									{/* Seats */}
									<div>
										<label style={labelStyle}>
											<Users
												size={8}
												style={{
													display: "inline",
													marginRight: 4,
													verticalAlign: "middle",
												}}
											/>
											Sillas
										</label>
										<input
											className="input-base"
											type="number"
											min={1}
											max={20}
											value={selectedTable.seats}
											onChange={(e) =>
												handleFieldChange(
													"seats",
													Math.max(1, Number(e.target.value)),
												)
											}
											style={{ width: "100%", fontSize: 13 }}
										/>
									</div>

									{/* Shape selector */}
									<div>
										<label style={labelStyle}>Forma</label>
										<div
											style={{
												display: "grid",
												gridTemplateColumns: "1fr 1fr",
												gap: 6,
											}}
										>
											{(
												[
													{
														shape: "square" as TableShape,
														icon: <Square size={16} />,
													},
													{
														shape: "round" as TableShape,
														icon: <Circle size={16} />,
													},
													{
														shape: "rect" as TableShape,
														icon: <RectangleHorizontal size={16} />,
													},
													{
														shape: "pool" as TableShape,
														icon: (
															<div
																style={{
																	width: 16,
																	height: 10,
																	borderRadius: 3,
																	border: "2px solid currentColor",
																	background: "rgba(16,185,129,0.2)",
																}}
															/>
														),
													},
												] as const
											).map(({ shape, icon }) => {
												const isActive =
													(selectedTable.shape || "square") === shape;
												return (
													<button
														key={shape}
														onClick={() => handleFieldChange("shape", shape)}
														style={{
															padding: "8px 6px",
															borderRadius: 8,
															border: isActive
																? "1px solid rgba(245,158,11,0.4)"
																: "1px solid var(--s4)",
															background: isActive
																? "rgba(245,158,11,0.1)"
																: "transparent",
															color: isActive ? "#f59e0b" : "#666",
															cursor: "pointer",
															display: "flex",
															flexDirection: "column",
															alignItems: "center",
															gap: 4,
															fontSize: 9,
															fontFamily: "var(--font-syne)",
															fontWeight: 600,
															textTransform: "uppercase",
															letterSpacing: "0.1em",
															transition: "all 0.2s",
														}}
													>
														{icon}
														{SHAPE_LABELS[shape]}
													</button>
												);
											})}
										</div>
									</div>

									{/* Position info */}
									<div
										style={{
											display: "grid",
											gridTemplateColumns: "1fr 1fr",
											gap: 8,
										}}
									>
										<div>
											<label style={labelStyle}>X</label>
											<input
												className="input-base"
												type="number"
												value={Math.round(selectedTable.x)}
												onChange={(e) =>
													handleFieldChange("x", Number(e.target.value))
												}
												style={{
													width: "100%",
													fontSize: 12,
												}}
											/>
										</div>
										<div>
											<label style={labelStyle}>Y</label>
											<input
												className="input-base"
												type="number"
												value={Math.round(selectedTable.y)}
												onChange={(e) =>
													handleFieldChange("y", Number(e.target.value))
												}
												style={{
													width: "100%",
													fontSize: 12,
												}}
											/>
										</div>
									</div>

									{/* Size */}
									<div
										style={{
											display: "grid",
											gridTemplateColumns: "1fr 1fr",
											gap: 8,
										}}
									>
										<div>
											<label style={labelStyle}>Ancho</label>
											<input
												className="input-base"
												type="number"
												min={40}
												value={Math.round(selectedTable.w || DEFAULT_W)}
												onChange={(e) =>
													handleFieldChange(
														"w",
														Math.max(40, Number(e.target.value)),
													)
												}
												style={{
													width: "100%",
													fontSize: 12,
												}}
											/>
										</div>
										<div>
											<label style={labelStyle}>Alto</label>
											<input
												className="input-base"
												type="number"
												min={40}
												value={Math.round(selectedTable.h || DEFAULT_H)}
												onChange={(e) =>
													handleFieldChange(
														"h",
														Math.max(40, Number(e.target.value)),
													)
												}
												style={{
													width: "100%",
													fontSize: 12,
												}}
											/>
										</div>
									</div>

									{/* Status */}
									<div>
										<label style={labelStyle}>Estado</label>
										<div
											style={{
												display: "flex",
												gap: 6,
												flexWrap: "wrap",
											}}
										>
											{(["available", "occupied", "reserved"] as const).map(
												(st) => {
													const info = STATUS_COLORS[st];
													const isActive = selectedTable.status === st;
													return (
														<button
															key={st}
															onClick={() => handleFieldChange("status", st)}
															style={{
																padding: "4px 10px",
																borderRadius: 99,
																border: `1px solid ${info.color}${isActive ? "66" : "22"}`,
																background: isActive ? info.bg : "transparent",
																color: isActive ? info.color : "#666",
																cursor: "pointer",
																fontSize: 9,
																fontFamily: "var(--font-syne)",
																fontWeight: 700,
																letterSpacing: "0.1em",
																textTransform: "uppercase",
																transition: "all 0.2s",
															}}
														>
															{info.label}
														</button>
													);
												},
											)}
										</div>
									</div>

									{/* QR Preview */}
									<div>
										<label style={labelStyle}>
											<QrCode
												size={8}
												style={{
													display: "inline",
													marginRight: 4,
													verticalAlign: "middle",
												}}
											/>
											Codigo QR
										</label>
										<div
											style={{
												background: "white",
												padding: 10,
												borderRadius: 10,
												display: "flex",
												justifyContent: "center",
												marginBottom: 8,
											}}
										>
											<QRCodeSVG
												id={`qr-${selectedTable.id}`}
												value={qrUrl(selectedTable.id, selectedTable.number)}
												size={120}
												bgColor="white"
												fgColor="#080808"
												level="M"
											/>
										</div>
										<button
											onClick={() =>
												downloadQR(selectedTable.number, selectedTable.id)
											}
											style={{
												width: "100%",
												padding: "8px",
												borderRadius: 8,
												border: "1px solid var(--s4)",
												background: "transparent",
												color: "#888",
												cursor: "pointer",
												fontSize: 10,
												fontFamily: "var(--font-syne)",
												fontWeight: 600,
												letterSpacing: "0.1em",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												gap: 6,
											}}
										>
											<Download size={12} />
											DESCARGAR QR PNG
										</button>
									</div>

									{/* Delete */}
									<button
										onClick={() => void handleDeleteTable(selectedTable.id)}
										style={{
											width: "100%",
											padding: "10px",
											borderRadius: 8,
											border:
												confirmDeleteId === selectedTable.id
													? "1px solid rgba(239,68,68,0.5)"
													: "1px solid var(--s4)",
											background:
												confirmDeleteId === selectedTable.id
													? "rgba(239,68,68,0.1)"
													: "transparent",
											color:
												confirmDeleteId === selectedTable.id
													? "#ef4444"
													: "#666",
											cursor: "pointer",
											fontSize: 10,
											fontFamily: "var(--font-syne)",
											fontWeight: 600,
											letterSpacing: "0.1em",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											gap: 6,
											transition: "all 0.2s",
										}}
									>
										<Trash2 size={12} />
										{confirmDeleteId === selectedTable.id
											? "CONFIRMAR ELIMINACION"
											: "ELIMINAR MESA"}
									</button>
								</div>
							) : (
								/* No selection hint */
								<div
									style={{
										background: "var(--s1)",
										border: "1px solid var(--s3)",
										borderRadius: 16,
										padding: "40px 16px",
										textAlign: "center",
									}}
								>
									<LayoutGrid
										size={32}
										style={{
											color: "#333",
											margin: "0 auto 12px",
										}}
									/>
									<p
										className="font-display uppercase"
										style={{
											fontSize: 10,
											letterSpacing: "0.2em",
											color: "#555",
											marginBottom: 4,
										}}
									>
										Selecciona una mesa
									</p>
									<p
										className="font-body"
										style={{ fontSize: 11, color: "#444" }}
									>
										Hace clic en una mesa del plano para editar sus propiedades
									</p>
								</div>
							)}

							{/* Zone table list */}
							<div
								style={{
									background: "var(--s1)",
									border: "1px solid var(--s3)",
									borderRadius: 16,
									overflow: "hidden",
								}}
							>
								<div
									style={{
										padding: "10px 14px",
										borderBottom: "1px solid var(--s3)",
										background: "var(--s2)",
									}}
								>
									<span
										className="font-display uppercase"
										style={{
											fontSize: 9,
											letterSpacing: "0.2em",
											color: "#888",
											fontWeight: 600,
										}}
									>
										Mesas en zona ({zoneTables.length})
									</span>
								</div>
								<div
									style={{
										maxHeight: 200,
										overflow: "auto",
									}}
								>
									{zoneTables.length === 0 && (
										<p
											className="font-body"
											style={{
												fontSize: 11,
												color: "#555",
												padding: "16px 14px",
												textAlign: "center",
											}}
										>
											Sin mesas
										</p>
									)}
									{zoneTables
										.slice()
										.sort((a, b) => a.number - b.number)
										.map((t) => {
											const statusInfo =
												STATUS_COLORS[t.status] ?? STATUS_COLORS.available;
											return (
												<button
													key={t.id}
													onClick={() => setSelectedId(t.id)}
													style={{
														width: "100%",
														padding: "8px 14px",
														display: "flex",
														alignItems: "center",
														justifyContent: "space-between",
														background:
															selectedId === t.id
																? "rgba(245,158,11,0.06)"
																: "transparent",
														border: "none",
														borderBottom: "1px solid var(--s3)",
														cursor: "pointer",
														color: "inherit",
														transition: "background 0.15s",
													}}
												>
													<div
														style={{
															display: "flex",
															alignItems: "center",
															gap: 8,
														}}
													>
														<span
															className="font-kds"
															style={{
																fontSize: 16,
																color:
																	t.shape === "pool" ? "#10b981" : "#f59e0b",
															}}
														>
															{t.number}
														</span>
														<span
															style={{
																fontSize: 10,
																color: "#666",
																fontFamily: "var(--font-dm-sans)",
															}}
														>
															{t.seats} sillas
														</span>
													</div>
													<div
														style={{
															width: 6,
															height: 6,
															borderRadius: "50%",
															background: statusInfo.color,
														}}
													/>
												</button>
											);
										})}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* === HIDDEN QR CODES for ZIP download === */}
				<div
					style={{
						position: "absolute",
						left: -9999,
						top: -9999,
						opacity: 0,
						pointerEvents: "none",
					}}
				>
					{tables.map((table) => (
						<QRCodeSVG
							key={table.id}
							id={`qr-${table.id}`}
							value={qrUrl(table.id, table.number)}
							size={200}
							bgColor="white"
							fgColor="#080808"
							level="M"
						/>
					))}
				</div>
			</div>
		</div>
	);
}
