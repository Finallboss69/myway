"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { use } from "react";
import dynamic from "next/dynamic";
import type { TrackingData } from "@/lib/types";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";

// Leaflet must be loaded client-side only
const LiveMap = dynamic(() => import("./LiveMap"), { ssr: false });

const STATUS_STEPS = [
	"pending",
	"preparing",
	"en_camino",
	"delivered",
] as const;

const STATUS_LABELS: Record<string, string> = {
	pending: "Recibido",
	preparing: "Preparando",
	en_camino: "En camino",
	delivered: "Entregado",
};

function formatCurrency(n: number) {
	return "$" + Math.round(n).toLocaleString("es-AR");
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLng / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// My Way Olivos coordinates (destination) — used as a fallback for ETA
const MYWAY_LAT = -34.5094;
const MYWAY_LNG = -58.5082;

export default function TrackPage({
	params,
}: {
	params: Promise<{ orderId: string }>;
}) {
	const { orderId } = use(params);
	const [data, setData] = useState<TrackingData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const fetchTracking = useCallback(async () => {
		try {
			const res = await fetch(`/api/delivery/${orderId}/tracking`);
			if (!res.ok) throw new Error("Pedido no encontrado");
			const d: TrackingData = await res.json();
			setData(d);
			if (d.status === "delivered") {
				if (pollRef.current) clearInterval(pollRef.current);
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error");
		}
	}, [orderId]);

	useEffect(() => {
		fetchTracking();
		pollRef.current = setInterval(fetchTracking, 5000);
		return () => {
			if (pollRef.current) clearInterval(pollRef.current);
		};
	}, [fetchTracking]);

	const stepIndex = data
		? STATUS_STEPS.indexOf(data.status as (typeof STATUS_STEPS)[number])
		: -1;

	// ETA: distance from repartidor to My Way at 30 km/h
	let etaMinutes: number | null = null;
	if (data?.repartidorLat && data?.repartidorLng) {
		const km = haversineKm(
			data.repartidorLat,
			data.repartidorLng,
			MYWAY_LAT,
			MYWAY_LNG,
		);
		etaMinutes = Math.max(1, Math.round((km / 30) * 60));
	}

	if (error) {
		return (
			<div
				style={{
					minHeight: "100vh",
					background: "#080808",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: 16,
					padding: 24,
					textAlign: "center",
				}}
			>
				<svg
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="#f59e0b"
					strokeWidth="1.5"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="8" x2="12" y2="12" />
					<line x1="12" y1="16" x2="12.01" y2="16" />
				</svg>
				<p style={{ color: "#f0f0f0", fontSize: 16, fontWeight: 700 }}>
					{error}
				</p>
			</div>
		);
	}

	if (!data) {
		return (
			<div
				style={{
					minHeight: "100vh",
					background: "#080808",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<div
					style={{
						width: 32,
						height: 32,
						borderRadius: "50%",
						border: "2px solid #f59e0b",
						borderTopColor: "transparent",
						animation: "spin 0.8s linear infinite",
					}}
				/>
				<style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
			</div>
		);
	}

	const showMap =
		data.status === "en_camino" &&
		data.repartidorLat !== null &&
		data.repartidorLng !== null;

	return (
		<div
			style={{
				minHeight: "100vh",
				background: "#080808",
				color: "#f0f0f0",
				fontFamily: "'Segoe UI', system-ui, sans-serif",
				paddingBottom: 40,
			}}
		>
			{/* Header */}
			<div
				style={{
					background: "#0e0e0e",
					borderBottom: "1px solid #1e1e1e",
					padding: "16px 20px",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<div>
					<div
						style={{
							fontSize: 9,
							letterSpacing: "0.25em",
							textTransform: "uppercase",
							color: "#f59e0b",
							marginBottom: 2,
						}}
					>
						My Way
					</div>
					<div style={{ fontSize: 13, fontWeight: 700 }}>
						Seguimiento del pedido
					</div>
				</div>
				{etaMinutes !== null && (
					<div
						style={{
							padding: "6px 12px",
							borderRadius: 10,
							background: "rgba(245,158,11,0.12)",
							border: "1px solid rgba(245,158,11,0.3)",
							color: "#f59e0b",
							fontSize: 13,
							fontWeight: 700,
						}}
					>
						~{etaMinutes} min
					</div>
				)}
			</div>

			{/* Map — only when en_camino and GPS available */}
			{showMap && (
				<div style={{ height: "55vw", maxHeight: 320, position: "relative" }}>
					<LiveMap lat={data.repartidorLat!} lng={data.repartidorLng!} />
				</div>
			)}

			{/* Delivered celebration */}
			{data.status === "delivered" && (
				<div
					style={{
						margin: "20px 16px",
						padding: "28px",
						background: "rgba(16,185,129,0.08)",
						border: "1px solid rgba(16,185,129,0.2)",
						borderRadius: 20,
						textAlign: "center",
					}}
				>
					<svg
						width="40"
						height="40"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#10b981"
						strokeWidth="1.5"
						style={{ margin: "0 auto 12px", display: "block" }}
					>
						<path d="M20 6L9 17l-5-5" />
					</svg>
					<p style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>
						¡Entregado!
					</p>
					<p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
						Disfrutá tu pedido, {data.customerName}
					</p>
				</div>
			)}

			<div
				style={{
					maxWidth: 480,
					margin: "0 auto",
					padding: "20px 16px",
					display: "flex",
					flexDirection: "column",
					gap: 16,
				}}
			>
				{/* Timeline */}
				<div
					style={{
						background: "#0e0e0e",
						border: "1px solid #1e1e1e",
						borderRadius: 16,
						padding: "16px",
					}}
				>
					<p
						style={{
							fontSize: 9,
							letterSpacing: "0.2em",
							textTransform: "uppercase",
							color: "#555",
							marginBottom: 16,
						}}
					>
						Estado del pedido
					</p>
					<div style={{ display: "flex", flexDirection: "column" }}>
						{STATUS_STEPS.map((step, i) => {
							const done = i <= stepIndex;
							const active = i === stepIndex;
							return (
								<div
									key={step}
									style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
								>
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
										}}
									>
										<div
											style={{
												width: 20,
												height: 20,
												borderRadius: "50%",
												background: done ? "#f59e0b" : "#1e1e1e",
												border: `2px solid ${done ? "#f59e0b" : "#333"}`,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												flexShrink: 0,
												boxShadow: active
													? "0 0 10px rgba(245,158,11,0.5)"
													: "none",
												transition: "all 0.3s",
											}}
										>
											{done && (
												<svg
													width="10"
													height="10"
													viewBox="0 0 24 24"
													fill="none"
													stroke="#080808"
													strokeWidth="3"
												>
													<path d="M20 6L9 17l-5-5" />
												</svg>
											)}
										</div>
										{i < STATUS_STEPS.length - 1 && (
											<div
												style={{
													width: 2,
													height: 28,
													background: i < stepIndex ? "#f59e0b" : "#1e1e1e",
													transition: "background 0.3s",
												}}
											/>
										)}
									</div>
									<div style={{ paddingTop: 1, paddingBottom: 28 }}>
										<span
											style={{
												fontSize: 13,
												fontWeight: active ? 700 : 500,
												color: done ? (active ? "#f59e0b" : "#f0f0f0") : "#444",
												transition: "color 0.3s",
											}}
										>
											{STATUS_LABELS[step]}
										</span>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Order summary */}
				<div
					style={{
						background: "#0e0e0e",
						border: "1px solid #1e1e1e",
						borderRadius: 16,
						overflow: "hidden",
					}}
				>
					<div
						style={{ padding: "12px 16px", borderBottom: "1px solid #1e1e1e" }}
					>
						<p
							style={{
								fontSize: 9,
								letterSpacing: "0.2em",
								textTransform: "uppercase",
								color: "#555",
							}}
						>
							Resumen del pedido
						</p>
					</div>
					<div
						style={{
							padding: "12px 16px",
							display: "flex",
							flexDirection: "column",
							gap: 8,
						}}
					>
						{data.items.map((item, i) => (
							<div
								key={i}
								style={{ display: "flex", justifyContent: "space-between" }}
							>
								<span style={{ fontSize: 13, color: "#aaa" }}>
									{item.qty}× {item.name}
								</span>
								<span
									style={{ fontSize: 13, color: "#f0f0f0", fontWeight: 600 }}
								>
									{formatCurrency(item.price * item.qty)}
								</span>
							</div>
						))}
					</div>
					<div
						style={{
							padding: "10px 16px",
							borderTop: "1px solid #1e1e1e",
							display: "flex",
							justifyContent: "space-between",
						}}
					>
						<span
							style={{
								fontSize: 12,
								color: "#555",
								textTransform: "uppercase",
								letterSpacing: "0.1em",
							}}
						>
							Total
						</span>
						<span
							style={{
								fontSize: 20,
								fontWeight: 700,
								color: "#f59e0b",
								lineHeight: 1,
							}}
						>
							{formatCurrency(data.total)}
						</span>
					</div>
				</div>
			</div>
			<HelpButton {...helpContent.trackOrder} variant="float" />
		</div>
	);
}
