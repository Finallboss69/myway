"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";
import { MapPin, Navigation, Radio } from "lucide-react";
import dynamic from "next/dynamic";
import type { RepartidorPin } from "./AdminFleetMap";

const AdminFleetMap = dynamic(() => import("./AdminFleetMap"), { ssr: false });

interface ActiveOrder {
	id: string;
	customerName: string;
	address: string;
	total: number;
	repartidorLat: number | null;
	repartidorLng: number | null;
	repartidorUpdatedAt: string | null;
	createdAt: string;
}

function secondsAgo(iso: string) {
	return Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
}

function formatTime(iso: string) {
	return new Date(iso).toLocaleTimeString("es-AR", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatCurrency(n: number) {
	return "$" + Math.round(n).toLocaleString("es-AR");
}

export default function AdminRepartidoresPage() {
	const [orders, setOrders] = useState<ActiveOrder[]>([]);
	const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const fetchOrders = useCallback(async () => {
		try {
			const res = await fetch("/api/delivery?status=en_camino");
			if (!res.ok) return;
			const data = await res.json();
			setOrders(data.orders ?? []);
			setLastRefresh(new Date());
		} catch {
			// silent
		}
	}, []);

	useEffect(() => {
		fetchOrders();
		pollRef.current = setInterval(fetchOrders, 5000);
		return () => {
			if (pollRef.current) clearInterval(pollRef.current);
		};
	}, [fetchOrders]);

	const pins: RepartidorPin[] = orders
		.filter((o) => o.repartidorLat !== null && o.repartidorLng !== null)
		.map((o) => ({
			orderId: o.id,
			customerName: o.customerName,
			address: o.address,
			lat: o.repartidorLat!,
			lng: o.repartidorLng!,
			updatedAt: o.repartidorUpdatedAt!,
		}));

	const noGps = orders.filter(
		(o) => o.repartidorLat === null || o.repartidorLng === null,
	);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100vh",
				gap: 0,
				minHeight: 0,
				background: "var(--s0)",
			}}
		>
			{/* Header */}
			<div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
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
								MAPA DE REPARTIDORES
							</h1>
							<p
								className="font-body"
								style={{ fontSize: 12, color: "#666", marginTop: 2 }}
							>
								Pedidos en camino en tiempo real - actualiza cada 5s
							</p>
							<HelpButton {...helpContent.repartidores} />
						</div>
					</div>
					<div className="flex items-center gap-3">
						<div
							style={{
								padding: "6px 14px",
								borderRadius: 10,
								background:
									pins.length > 0 ? "rgba(34,197,94,0.12)" : "var(--s2)",
								border: `1px solid ${pins.length > 0 ? "rgba(34,197,94,0.3)" : "var(--s3)"}`,
								display: "flex",
								alignItems: "center",
								gap: 6,
							}}
						>
							<Radio
								size={12}
								style={{ color: pins.length > 0 ? "#22c55e" : "#666" }}
							/>
							<span
								className="font-display"
								style={{
									fontSize: 12,
									fontWeight: 700,
									color: pins.length > 0 ? "#22c55e" : "#666",
								}}
							>
								{pins.length} con GPS activo
							</span>
						</div>
						{lastRefresh && (
							<span
								className="font-body"
								style={{ fontSize: 11, color: "#666" }}
							>
								{lastRefresh.toLocaleTimeString("es-AR", {
									hour: "2-digit",
									minute: "2-digit",
									second: "2-digit",
								})}
							</span>
						)}
					</div>
				</div>
				<div className="divider-gold" style={{ marginBottom: 0 }} />
			</div>

			{/* Body */}
			<div
				className="flex-col md:flex-row"
				style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}
			>
				{/* Map */}
				<div
					style={{ flex: 1, position: "relative", minWidth: 0, minHeight: 300 }}
				>
					{orders.length === 0 ? (
						<div
							style={{
								height: "100%",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								gap: 12,
								color: "#666",
							}}
						>
							<MapPin size={40} style={{ color: "#444" }} />
							<p
								className="font-body"
								style={{ fontSize: 13, margin: 0, color: "#666" }}
							>
								No hay pedidos en camino ahora
							</p>
						</div>
					) : (
						<AdminFleetMap pins={pins} />
					)}
				</div>

				{/* Sidebar */}
				<div
					style={{
						width: "100%",
						maxWidth: "100%",
						borderLeft: "none",
						borderTop: "1px solid var(--s3)",
						overflowY: "auto",
						flexShrink: 0,
						background: "var(--s1)",
						maxHeight: 280,
					}}
					className="md:!border-t-0 md:!border-l md:!max-h-none md:!w-[280px]"
				>
					<div
						style={{
							padding: "14px 16px",
							borderBottom: "1px solid var(--s3)",
							background: "var(--s2)",
						}}
					>
						<div className="flex items-center gap-2">
							<Navigation size={12} style={{ color: "var(--gold)" }} />
							<span
								className="font-display uppercase"
								style={{
									fontSize: 10,
									letterSpacing: "0.15em",
									color: "#ccc",
									fontWeight: 600,
								}}
							>
								Pedidos activos ({orders.length})
							</span>
						</div>
					</div>

					{orders.length === 0 ? (
						<div style={{ padding: 24, textAlign: "center" }}>
							<p
								className="font-body"
								style={{ fontSize: 12, color: "#666", margin: 0 }}
							>
								Sin pedidos en camino
							</p>
						</div>
					) : (
						<div
							style={{
								padding: 8,
								display: "flex",
								flexDirection: "column",
								gap: 6,
							}}
						>
							{orders.map((order) => {
								const hasGps =
									order.repartidorLat !== null && order.repartidorLng !== null;
								const staleSec = order.repartidorUpdatedAt
									? secondsAgo(order.repartidorUpdatedAt)
									: null;
								const isStale = staleSec !== null && staleSec > 30;

								return (
									<div
										key={order.id}
										style={{
											background: "var(--s2)",
											border: "1px solid var(--s3)",
											borderRadius: 12,
											padding: "10px 12px",
											display: "flex",
											flexDirection: "column",
											gap: 4,
										}}
									>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
											}}
										>
											<span
												className="font-display"
												style={{
													fontSize: 13,
													fontWeight: 700,
													color: "#f5f5f5",
												}}
											>
												{order.customerName}
											</span>
											<span
												className="font-kds"
												style={{ fontSize: 13, color: "var(--gold)" }}
											>
												{formatCurrency(order.total)}
											</span>
										</div>
										<span
											className="font-body"
											style={{ fontSize: 11, color: "#888", lineHeight: 1.3 }}
										>
											{order.address}
										</span>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: 6,
												marginTop: 2,
											}}
										>
											<span
												style={{
													display: "flex",
													alignItems: "center",
													gap: 4,
													fontSize: 10,
													color: hasGps
														? isStale
															? "#f59e0b"
															: "#22c55e"
														: "#555",
												}}
											>
												<span
													style={{
														width: 6,
														height: 6,
														borderRadius: "50%",
														background: hasGps
															? isStale
																? "#f59e0b"
																: "#22c55e"
															: "#333",
														flexShrink: 0,
													}}
												/>
												{hasGps
													? isStale
														? `GPS hace ${staleSec}s`
														: "GPS activo"
													: "Sin GPS"}
											</span>
											<span
												className="font-body"
												style={{ fontSize: 10, color: "#666" }}
											>
												Pedido {formatTime(order.createdAt)}
											</span>
										</div>
									</div>
								);
							})}

							{noGps.length > 0 && (
								<p
									className="font-body"
									style={{ fontSize: 10, color: "#666", margin: "4px 4px 0" }}
								>
									{noGps.length} pedido(s) sin GPS activo aun
								</p>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
