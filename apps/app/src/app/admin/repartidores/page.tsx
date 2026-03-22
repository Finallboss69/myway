"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
			const res = await fetch("/api/delivery?status=on_the_way");
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
				height: "100%",
				gap: 0,
			}}
		>
			{/* Header */}
			<div
				style={{
					padding: "20px 24px 16px",
					borderBottom: "1px solid var(--s3)",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					flexShrink: 0,
				}}
			>
				<div>
					<h1
						style={{
							fontSize: 18,
							fontWeight: 700,
							color: "var(--ink-primary)",
							margin: 0,
						}}
					>
						Mapa de Repartidores
					</h1>
					<p
						style={{
							fontSize: 11,
							color: "var(--ink-tertiary)",
							margin: "2px 0 0",
						}}
					>
						Pedidos en camino en tiempo real · actualiza cada 5 s
					</p>
				</div>
				<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
					<div
						style={{
							padding: "6px 14px",
							borderRadius: 10,
							background:
								pins.length > 0 ? "rgba(16,185,129,0.1)" : "var(--surface-2)",
							border: `1px solid ${pins.length > 0 ? "rgba(16,185,129,0.25)" : "var(--s3)"}`,
							color: pins.length > 0 ? "#10b981" : "var(--ink-tertiary)",
							fontSize: 13,
							fontWeight: 700,
						}}
					>
						{pins.length} con GPS activo
					</div>
					{lastRefresh && (
						<span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>
							{lastRefresh.toLocaleTimeString("es-AR", {
								hour: "2-digit",
								minute: "2-digit",
								second: "2-digit",
							})}
						</span>
					)}
				</div>
			</div>

			{/* Body */}
			<div
				style={{
					flex: 1,
					display: "flex",
					overflow: "hidden",
					minHeight: 0,
				}}
			>
				{/* Map */}
				<div style={{ flex: 1, position: "relative", minWidth: 0 }}>
					{orders.length === 0 ? (
						<div
							style={{
								height: "100%",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								gap: 12,
								color: "var(--ink-tertiary)",
							}}
						>
							<svg
								width="40"
								height="40"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
							>
								<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
								<circle cx="12" cy="10" r="3" />
							</svg>
							<p style={{ fontSize: 13, margin: 0 }}>
								No hay pedidos en camino ahora
							</p>
						</div>
					) : (
						<AdminFleetMap pins={pins} />
					)}
				</div>

				{/* Sidebar list */}
				<div
					style={{
						width: 280,
						borderLeft: "1px solid var(--s3)",
						overflowY: "auto",
						flexShrink: 0,
						background: "var(--surface-1)",
					}}
				>
					<div
						style={{
							padding: "12px 16px",
							borderBottom: "1px solid var(--s3)",
						}}
					>
						<p
							style={{
								fontSize: 9,
								letterSpacing: "0.2em",
								textTransform: "uppercase",
								color: "var(--ink-tertiary)",
								margin: 0,
							}}
						>
							Pedidos activos ({orders.length})
						</p>
					</div>

					{orders.length === 0 ? (
						<div
							style={{
								padding: 24,
								textAlign: "center",
								color: "var(--ink-tertiary)",
								fontSize: 12,
							}}
						>
							Sin pedidos en camino
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
											background: "var(--surface-2)",
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
												style={{
													fontSize: 13,
													fontWeight: 700,
													color: "var(--ink-primary)",
												}}
											>
												{order.customerName}
											</span>
											<span
												style={{
													fontSize: 11,
													fontWeight: 700,
													color: "var(--brand-500)",
												}}
											>
												{formatCurrency(order.total)}
											</span>
										</div>
										<span
											style={{
												fontSize: 11,
												color: "var(--ink-tertiary)",
												lineHeight: 1.3,
											}}
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
															: "#10b981"
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
																: "#10b981"
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
												style={{ fontSize: 10, color: "var(--ink-tertiary)" }}
											>
												Pedido {formatTime(order.createdAt)}
											</span>
										</div>
									</div>
								);
							})}

							{/* Orders without GPS */}
							{noGps.length > 0 && (
								<p
									style={{
										fontSize: 10,
										color: "var(--ink-tertiary)",
										margin: "4px 4px 0",
									}}
								>
									{noGps.length} pedido(s) sin GPS activo aún
								</p>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
