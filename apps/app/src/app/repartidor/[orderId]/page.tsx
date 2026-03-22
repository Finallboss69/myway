"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { use } from "react";
import type { TrackingData } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
	pending: "Pendiente",
	preparing: "Preparando",
	on_the_way: "En camino",
	delivered: "Entregado",
};

const NEXT_STATUS: Record<string, string | null> = {
	pending: "preparing",
	preparing: "on_the_way",
	on_the_way: "delivered",
	delivered: null,
};

const ADVANCE_LABEL: Record<string, string> = {
	pending: "Iniciar preparación",
	preparing: "Salir a entregar",
	on_the_way: "Confirmar entrega",
};

function formatCurrency(n: number) {
	return "$" + Math.round(n).toLocaleString("es-AR");
}

export default function RepartidorPage({
	params,
}: {
	params: Promise<{ orderId: string }>;
}) {
	const { orderId } = use(params);

	const [order, setOrder] = useState<TrackingData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [gpsActive, setGpsActive] = useState(false);
	const [gpsError, setGpsError] = useState<string | null>(null);
	const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
		null,
	);
	const [advancing, setAdvancing] = useState(false);

	const lastSentRef = useRef<number>(0);
	const watchIdRef = useRef<number | null>(null);

	const fetchOrder = useCallback(async () => {
		try {
			const res = await fetch(`/api/delivery/${orderId}/tracking`);
			if (!res.ok) throw new Error("Pedido no encontrado");
			const data: TrackingData = await res.json();
			setOrder(data);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error al cargar el pedido");
		} finally {
			setLoading(false);
		}
	}, [orderId]);

	useEffect(() => {
		fetchOrder();
	}, [fetchOrder]);

	const sendLocation = useCallback(
		async (lat: number, lng: number) => {
			const now = Date.now();
			if (now - lastSentRef.current < 8000) return;
			lastSentRef.current = now;
			try {
				await fetch(`/api/delivery/${orderId}/location`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ lat, lng }),
				});
			} catch {
				// silent — GPS updates are best-effort
			}
		},
		[orderId],
	);

	const activateGps = () => {
		if (!("geolocation" in navigator)) {
			setGpsError("Tu dispositivo no soporta GPS");
			return;
		}
		const id = navigator.geolocation.watchPosition(
			(pos) => {
				const lat = pos.coords.latitude;
				const lng = pos.coords.longitude;
				setCoords({ lat, lng });
				setGpsActive(true);
				setGpsError(null);
				sendLocation(lat, lng);
			},
			(err) => {
				setGpsError(
					err.code === 1
						? "Permiso de GPS denegado. Activalo en la configuración."
						: "Error al obtener la ubicación",
				);
			},
			{ enableHighAccuracy: true, maximumAge: 5000 },
		);
		watchIdRef.current = id;
	};

	useEffect(() => {
		return () => {
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current);
			}
		};
	}, []);

	const advanceStatus = async () => {
		if (!order) return;
		const next = NEXT_STATUS[order.status];
		if (!next) return;
		setAdvancing(true);
		try {
			await fetch(`/api/delivery/${orderId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: next }),
			});
			setOrder((prev) =>
				prev ? { ...prev, status: next as TrackingData["status"] } : prev,
			);
		} catch {
			// ignore
		} finally {
			setAdvancing(false);
		}
	};

	if (loading) {
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

	if (error || !order) {
		return (
			<div
				style={{
					minHeight: "100vh",
					background: "#080808",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					padding: "24px",
					gap: 16,
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
					{error ?? "Pedido no encontrado"}
				</p>
			</div>
		);
	}

	const isDelivered = order.status === "delivered";
	const nextStatus = NEXT_STATUS[order.status];

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
					<div style={{ fontSize: 14, fontWeight: 700 }}>
						Panel del repartidor
					</div>
				</div>
				<div
					style={{
						padding: "4px 10px",
						borderRadius: 8,
						background: isDelivered
							? "rgba(16,185,129,0.12)"
							: "rgba(245,158,11,0.12)",
						border: `1px solid ${isDelivered ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
						color: isDelivered ? "#34d399" : "#f59e0b",
						fontSize: 10,
						fontWeight: 700,
						letterSpacing: "0.1em",
						textTransform: "uppercase" as const,
					}}
				>
					{STATUS_LABELS[order.status] ?? order.status}
				</div>
			</div>

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
				{/* Order details */}
				<div
					style={{
						background: "#0e0e0e",
						border: "1px solid #1e1e1e",
						borderRadius: 16,
						overflow: "hidden",
					}}
				>
					<div
						style={{
							padding: "14px 16px",
							borderBottom: "1px solid #1e1e1e",
							display: "flex",
							alignItems: "center",
							gap: 8,
						}}
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#f59e0b"
							strokeWidth="2"
						>
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
							<circle cx="12" cy="7" r="4" />
						</svg>
						<span style={{ fontSize: 13, fontWeight: 700 }}>
							{order.customerName}
						</span>
					</div>
					<div
						style={{
							padding: "12px 16px",
							display: "flex",
							flexDirection: "column",
							gap: 8,
						}}
					>
						{order.items.map((item, i) => (
							<div
								key={i}
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									gap: 8,
								}}
							>
								<span style={{ fontSize: 12, color: "#aaa" }}>
									{item.qty}× {item.name}
								</span>
								<span
									style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}
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
							alignItems: "center",
						}}
					>
						<span
							style={{
								fontSize: 11,
								color: "#666",
								textTransform: "uppercase" as const,
								letterSpacing: "0.1em",
							}}
						>
							Total
						</span>
						<span
							style={{
								fontSize: 22,
								fontWeight: 700,
								color: "#f59e0b",
								lineHeight: 1,
							}}
						>
							{formatCurrency(order.total)}
						</span>
					</div>
				</div>

				{/* GPS card */}
				<div
					style={{
						background: "#0e0e0e",
						border: `1px solid ${gpsActive ? "rgba(16,185,129,0.3)" : "#1e1e1e"}`,
						borderRadius: 16,
						padding: "16px",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							marginBottom: 12,
						}}
					>
						<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke={gpsActive ? "#10b981" : "#666"}
								strokeWidth="2"
							>
								<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
								<circle cx="12" cy="10" r="3" />
							</svg>
							<span style={{ fontSize: 13, fontWeight: 700 }}>GPS</span>
						</div>
						{gpsActive && (
							<span
								style={{
									fontSize: 10,
									fontWeight: 700,
									letterSpacing: "0.1em",
									textTransform: "uppercase" as const,
									color: "#10b981",
									background: "rgba(16,185,129,0.12)",
									border: "1px solid rgba(16,185,129,0.25)",
									padding: "3px 8px",
									borderRadius: 6,
								}}
							>
								Activo
							</span>
						)}
					</div>

					{!gpsActive ? (
						<button
							onClick={activateGps}
							style={{
								width: "100%",
								padding: "12px",
								borderRadius: 12,
								border: "1px solid rgba(245,158,11,0.3)",
								background: "rgba(245,158,11,0.1)",
								color: "#f59e0b",
								fontSize: 13,
								fontWeight: 700,
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: 8,
							}}
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
							>
								<circle cx="12" cy="12" r="3" />
								<path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
							</svg>
							Activar GPS
						</button>
					) : (
						<div style={{ fontSize: 12, color: "#555" }}>
							{coords
								? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
								: "Obteniendo coordenadas..."}
						</div>
					)}

					{gpsError && (
						<p style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>
							{gpsError}
						</p>
					)}
				</div>

				{/* Status advance */}
				{!isDelivered && nextStatus && (
					<button
						onClick={advanceStatus}
						disabled={advancing}
						style={{
							width: "100%",
							padding: "14px",
							borderRadius: 14,
							border: "none",
							background: order.status === "on_the_way" ? "#10b981" : "#f59e0b",
							color: "#080808",
							fontSize: 14,
							fontWeight: 700,
							cursor: advancing ? "not-allowed" : "pointer",
							opacity: advancing ? 0.6 : 1,
							transition: "all 0.15s",
						}}
					>
						{advancing
							? "Actualizando..."
							: (ADVANCE_LABEL[order.status] ?? "Avanzar")}
					</button>
				)}

				{isDelivered && (
					<div
						style={{
							textAlign: "center",
							padding: "24px",
							background: "rgba(16,185,129,0.08)",
							border: "1px solid rgba(16,185,129,0.2)",
							borderRadius: 16,
						}}
					>
						<svg
							width="36"
							height="36"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#10b981"
							strokeWidth="1.5"
							style={{ margin: "0 auto 8px", display: "block" }}
						>
							<path d="M20 6L9 17l-5-5" />
						</svg>
						<p style={{ color: "#10b981", fontWeight: 700, fontSize: 16 }}>
							¡Entregado!
						</p>
					</div>
				)}

				<p
					style={{
						fontSize: 11,
						color: "#444",
						textAlign: "center",
						lineHeight: 1.6,
					}}
				>
					Compartí el link de tracking con el cliente para que siga su pedido en
					tiempo real.
				</p>
			</div>
		</div>
	);
}
