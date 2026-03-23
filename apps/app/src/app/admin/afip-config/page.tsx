"use client";

import { useState, useEffect, useCallback } from "react";
import HelpButton from "@/components/HelpButton";
import { helpContent } from "@/lib/help-content";
import {
	Settings,
	Shield,
	FileText,
	Save,
	CheckCircle2,
	AlertTriangle,
	CreditCard,
	Banknote,
	Smartphone,
	ToggleLeft,
	ToggleRight,
	Building2,
	Key,
	Zap,
	Globe,
} from "lucide-react";

interface AfipConfig {
	id: string;
	cuit: string;
	razonSocial: string;
	taxRegime: string;
	puntoVenta: number;
	certPem: string | null;
	keyPem: string | null;
	environment: string;
	autoInvoiceMP: boolean;
	autoInvoiceCash: boolean;
	autoInvoiceCard: boolean;
}

const TAX_REGIMES = [
	{
		value: "responsable_inscripto",
		label: "Responsable Inscripto",
		desc: "Emite Factura A (a RI) y B (a CF). IVA discriminado.",
	},
	{
		value: "monotributo",
		label: "Monotributista",
		desc: "Emite Factura C. Sin discriminar IVA.",
	},
	{
		value: "exento",
		label: "Exento",
		desc: "Exento de IVA. Factura C.",
	},
];

export default function AfipConfigPage() {
	const [config, setConfig] = useState<AfipConfig | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState("");

	const [cuit, setCuit] = useState("");
	const [razonSocial, setRazonSocial] = useState("");
	const [taxRegime, setTaxRegime] = useState("monotributo");
	const [puntoVenta, setPuntoVenta] = useState(1);
	const [environment, setEnvironment] = useState("testing");
	const [autoInvoiceMP, setAutoInvoiceMP] = useState(false);
	const [autoInvoiceCash, setAutoInvoiceCash] = useState(false);
	const [autoInvoiceCard, setAutoInvoiceCard] = useState(false);
	const [certPem, setCertPem] = useState("");
	const [keyPem, setKeyPem] = useState("");

	const fetchConfig = useCallback(async () => {
		try {
			const res = await fetch("/api/afip-config");
			const data = await res.json();
			setConfig(data);
			setCuit(data.cuit || "");
			setRazonSocial(data.razonSocial || "");
			setTaxRegime(data.taxRegime || "monotributo");
			setPuntoVenta(data.puntoVenta || 1);
			setEnvironment(data.environment || "testing");
			setAutoInvoiceMP(data.autoInvoiceMP ?? false);
			setAutoInvoiceCash(data.autoInvoiceCash ?? false);
			setAutoInvoiceCard(data.autoInvoiceCard ?? false);
		} catch {
			setError("Error cargando configuracion");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchConfig();
	}, [fetchConfig]);

	const handleSave = async () => {
		setSaving(true);
		setError("");
		setSaved(false);
		try {
			const body: Record<string, unknown> = {
				cuit,
				razonSocial,
				taxRegime,
				puntoVenta,
				environment,
				autoInvoiceMP,
				autoInvoiceCash,
				autoInvoiceCard,
			};
			if (certPem.trim()) body.certPem = certPem;
			if (keyPem.trim()) body.keyPem = keyPem;

			const res = await fetch("/api/afip-config", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			if (!res.ok) throw new Error("Error guardando");
			const data = await res.json();
			setConfig(data);
			setSaved(true);
			setTimeout(() => setSaved(false), 3000);
		} catch {
			setError("Error guardando configuracion");
		} finally {
			setSaving(false);
		}
	};

	const Toggle = ({
		value,
		onChange,
		label,
		icon: Icon,
	}: {
		value: boolean;
		onChange: (v: boolean) => void;
		label: string;
		icon: React.ComponentType<{ size: number; style?: React.CSSProperties }>;
	}) => (
		<button
			type="button"
			onClick={() => onChange(!value)}
			className="flex items-center gap-3 w-full transition-colors"
			style={{
				padding: "14px 20px",
				borderRadius: 14,
				background: value ? "rgba(245,158,11,0.08)" : "var(--s2)",
				border: `1px solid ${value ? "rgba(245,158,11,0.3)" : "var(--s3)"}`,
				cursor: "pointer",
				textAlign: "left",
			}}
			onMouseEnter={(e) => {
				if (!value)
					(e.currentTarget as HTMLButtonElement).style.background = "var(--s3)";
			}}
			onMouseLeave={(e) => {
				if (!value)
					(e.currentTarget as HTMLButtonElement).style.background = "var(--s2)";
			}}
		>
			<div
				style={{
					width: 34,
					height: 34,
					borderRadius: 10,
					background: value ? "rgba(245,158,11,0.15)" : "rgba(136,136,136,0.1)",
					border: `1px solid ${value ? "rgba(245,158,11,0.3)" : "var(--s4)"}`,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
				}}
			>
				<Icon size={16} style={{ color: value ? "var(--gold)" : "#666" }} />
			</div>
			<span
				className="font-body flex-1"
				style={{
					fontSize: 13,
					color: value ? "#f5f5f5" : "#888",
				}}
			>
				{label}
			</span>
			{value ? (
				<ToggleRight size={22} style={{ color: "var(--gold)" }} />
			) : (
				<ToggleLeft size={22} style={{ color: "#555" }} />
			)}
		</button>
	);

	if (loading) {
		return (
			<div style={{ minHeight: "100vh", background: "var(--s0)" }}>
				<div
					className="flex items-center justify-center"
					style={{ minHeight: "60vh" }}
				>
					<div
						className="font-display"
						style={{ fontSize: 13, color: "#666", letterSpacing: "0.15em" }}
					>
						Cargando configuracion...
					</div>
				</div>
			</div>
		);
	}

	return (
		<div style={{ minHeight: "100vh", background: "var(--s0)" }}>
			<div
				style={{ padding: "28px 24px 48px", maxWidth: 1200, margin: "0 auto" }}
			>
				{/* Header */}
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
								CONFIGURACION AFIP
							</h1>
							<p
								className="font-body"
								style={{ fontSize: 12, color: "#666", marginTop: 2 }}
							>
								Facturacion electronica y reglas de facturacion automatica
							</p>
							<HelpButton {...helpContent.afipConfig} />
						</div>
					</div>
					{config?.certPem === "***configured***" && (
						<div
							className="flex items-center gap-1.5"
							style={{
								padding: "6px 14px",
								borderRadius: 99,
								background: "rgba(16,185,129,0.1)",
								border: "1px solid rgba(16,185,129,0.3)",
							}}
						>
							<Shield size={11} style={{ color: "#10b981" }} />
							<span
								className="font-display uppercase"
								style={{
									fontSize: 9,
									letterSpacing: "0.12em",
									color: "#10b981",
									fontWeight: 600,
								}}
							>
								Certificado Configurado
							</span>
						</div>
					)}
				</div>
				<div className="divider-gold" style={{ marginBottom: 28 }} />

				{/* Error */}
				{error && (
					<div
						style={{
							marginBottom: 16,
							padding: "12px 20px",
							borderRadius: 12,
							background: "rgba(239,68,68,0.06)",
							border: "1px solid rgba(239,68,68,0.2)",
							display: "flex",
							alignItems: "center",
							gap: 10,
						}}
					>
						<AlertTriangle size={14} style={{ color: "#ef4444" }} />
						<span
							className="font-body"
							style={{ fontSize: 12, color: "#ef4444" }}
						>
							{error}
						</span>
					</div>
				)}

				<div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
					{/* Left column */}
					<div className="flex flex-col gap-6">
						{/* Datos Fiscales */}
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
								className="flex items-center justify-between"
								style={{
									padding: "14px 20px",
									borderBottom: "1px solid var(--s3)",
									background: "var(--s2)",
								}}
							>
								<div className="flex items-center gap-2.5">
									<Building2 size={14} style={{ color: "var(--gold)" }} />
									<span
										className="font-display uppercase"
										style={{
											fontSize: 11,
											letterSpacing: "0.15em",
											color: "#ccc",
											fontWeight: 600,
										}}
									>
										DATOS FISCALES
									</span>
								</div>
							</div>
							<div style={{ padding: 20 }}>
								<div className="flex flex-col gap-4">
									<div>
										<label
											className="font-display uppercase block"
											style={{
												fontSize: 9,
												letterSpacing: "0.2em",
												marginBottom: 6,
												color: "#888",
											}}
										>
											CUIT
										</label>
										<input
											className="input-base w-full"
											value={cuit}
											onChange={(e) => setCuit(e.target.value)}
											placeholder="20-12345678-9"
										/>
									</div>
									<div>
										<label
											className="font-display uppercase block"
											style={{
												fontSize: 9,
												letterSpacing: "0.2em",
												marginBottom: 6,
												color: "#888",
											}}
										>
											Razon Social
										</label>
										<input
											className="input-base w-full"
											value={razonSocial}
											onChange={(e) => setRazonSocial(e.target.value)}
											placeholder="MY WAY OLIVOS S.R.L."
										/>
									</div>
									<div>
										<label
											className="font-display uppercase block"
											style={{
												fontSize: 9,
												letterSpacing: "0.2em",
												marginBottom: 6,
												color: "#888",
											}}
										>
											Punto de Venta
										</label>
										<input
											className="input-base w-full"
											type="number"
											min={1}
											value={puntoVenta}
											onChange={(e) =>
												setPuntoVenta(parseInt(e.target.value) || 1)
											}
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Regimen Tributario */}
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
								className="flex items-center justify-between"
								style={{
									padding: "14px 20px",
									borderBottom: "1px solid var(--s3)",
									background: "var(--s2)",
								}}
							>
								<div className="flex items-center gap-2.5">
									<FileText size={14} style={{ color: "var(--gold)" }} />
									<span
										className="font-display uppercase"
										style={{
											fontSize: 11,
											letterSpacing: "0.15em",
											color: "#ccc",
											fontWeight: 600,
										}}
									>
										REGIMEN TRIBUTARIO
									</span>
								</div>
							</div>
							<div style={{ padding: 16 }}>
								<div className="flex flex-col gap-3">
									{TAX_REGIMES.map((r) => (
										<button
											key={r.value}
											type="button"
											onClick={() => setTaxRegime(r.value)}
											className="text-left transition-colors"
											style={{
												padding: "14px 16px",
												borderRadius: 12,
												cursor: "pointer",
												border: `1px solid ${taxRegime === r.value ? "rgba(245,158,11,0.4)" : "var(--s3)"}`,
												background:
													taxRegime === r.value
														? "rgba(245,158,11,0.06)"
														: "var(--s2)",
											}}
											onMouseEnter={(e) => {
												if (taxRegime !== r.value)
													(
														e.currentTarget as HTMLButtonElement
													).style.background = "var(--s3)";
											}}
											onMouseLeave={(e) => {
												if (taxRegime !== r.value)
													(
														e.currentTarget as HTMLButtonElement
													).style.background = "var(--s2)";
											}}
										>
											<div
												className="flex items-center gap-2"
												style={{ marginBottom: 4 }}
											>
												<div
													style={{
														width: 8,
														height: 8,
														borderRadius: "50%",
														background:
															taxRegime === r.value ? "var(--gold)" : "#555",
													}}
												/>
												<span
													className="font-display"
													style={{
														fontSize: 13,
														fontWeight: 600,
														color: taxRegime === r.value ? "#f5f5f5" : "#aaa",
													}}
												>
													{r.label}
												</span>
											</div>
											<p
												className="font-body"
												style={{
													fontSize: 11,
													lineHeight: 1.4,
													color: "#666",
													marginLeft: 16,
												}}
											>
												{r.desc}
											</p>
										</button>
									))}
								</div>
							</div>
						</div>

						{/* Entorno */}
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
								className="flex items-center justify-between"
								style={{
									padding: "14px 20px",
									borderBottom: "1px solid var(--s3)",
									background: "var(--s2)",
								}}
							>
								<div className="flex items-center gap-2.5">
									<Globe size={14} style={{ color: "var(--gold)" }} />
									<span
										className="font-display uppercase"
										style={{
											fontSize: 11,
											letterSpacing: "0.15em",
											color: "#ccc",
											fontWeight: 600,
										}}
									>
										ENTORNO
									</span>
								</div>
							</div>
							<div style={{ padding: 16 }}>
								<div className="flex gap-3">
									{(["testing", "production"] as const).map((env) => {
										const active = environment === env;
										const envColor =
											env === "production" ? "#10b981" : "var(--gold)";
										return (
											<button
												key={env}
												type="button"
												onClick={() => setEnvironment(env)}
												className="flex items-center gap-2 flex-1 transition-colors"
												style={{
													padding: "14px 18px",
													borderRadius: 12,
													cursor: "pointer",
													border: `1px solid ${active ? (env === "production" ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.4)") : "var(--s3)"}`,
													background: active
														? env === "production"
															? "rgba(16,185,129,0.06)"
															: "rgba(245,158,11,0.06)"
														: "var(--s2)",
												}}
												onMouseEnter={(e) => {
													if (!active)
														(
															e.currentTarget as HTMLButtonElement
														).style.background = "var(--s3)";
												}}
												onMouseLeave={(e) => {
													if (!active)
														(
															e.currentTarget as HTMLButtonElement
														).style.background = "var(--s2)";
												}}
											>
												<div
													style={{
														width: 8,
														height: 8,
														borderRadius: "50%",
														background: active ? envColor : "#555",
													}}
												/>
												<span
													className="font-display uppercase"
													style={{
														fontSize: 11,
														letterSpacing: "0.15em",
														color: active ? "#f5f5f5" : "#666",
													}}
												>
													{env === "testing" ? "Homologacion" : "Produccion"}
												</span>
											</button>
										);
									})}
								</div>
								{environment === "production" && (
									<div
										className="flex items-center gap-2"
										style={{
											padding: "10px 14px",
											marginTop: 10,
											borderRadius: 10,
											background: "rgba(245,158,11,0.06)",
											border: "1px solid rgba(245,158,11,0.15)",
										}}
									>
										<AlertTriangle size={12} style={{ color: "#f59e0b" }} />
										<span
											className="font-body"
											style={{ fontSize: 11, color: "#f59e0b" }}
										>
											Las facturas emitidas en produccion son fiscalmente
											validas
										</span>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Right column */}
					<div className="flex flex-col gap-6">
						{/* Certificados */}
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
								className="flex items-center justify-between"
								style={{
									padding: "14px 20px",
									borderBottom: "1px solid var(--s3)",
									background: "var(--s2)",
								}}
							>
								<div className="flex items-center gap-2.5">
									<Key size={14} style={{ color: "var(--gold)" }} />
									<span
										className="font-display uppercase"
										style={{
											fontSize: 11,
											letterSpacing: "0.15em",
											color: "#ccc",
											fontWeight: 600,
										}}
									>
										CERTIFICADOS AFIP
									</span>
								</div>
							</div>
							<div style={{ padding: 20 }}>
								<div className="flex flex-col gap-4">
									<div>
										<label
											className="font-display uppercase block"
											style={{
												fontSize: 9,
												letterSpacing: "0.2em",
												marginBottom: 6,
												color: "#888",
											}}
										>
											Certificado (.pem)
										</label>
										<textarea
											className="input-base w-full"
											rows={4}
											value={certPem}
											onChange={(e) => setCertPem(e.target.value)}
											placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
											style={{ fontFamily: "monospace", fontSize: 11 }}
										/>
										{config?.certPem === "***configured***" && !certPem && (
											<span
												className="font-body"
												style={{
													fontSize: 10,
													marginTop: 4,
													display: "block",
													color: "#10b981",
												}}
											>
												Certificado ya configurado (dejar vacio para mantener)
											</span>
										)}
									</div>
									<div>
										<label
											className="font-display uppercase block"
											style={{
												fontSize: 9,
												letterSpacing: "0.2em",
												marginBottom: 6,
												color: "#888",
											}}
										>
											Clave Privada (.key)
										</label>
										<textarea
											className="input-base w-full"
											rows={4}
											value={keyPem}
											onChange={(e) => setKeyPem(e.target.value)}
											placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
											style={{ fontFamily: "monospace", fontSize: 11 }}
										/>
										{config?.keyPem === "***configured***" && !keyPem && (
											<span
												className="font-body"
												style={{
													fontSize: 10,
													marginTop: 4,
													display: "block",
													color: "#10b981",
												}}
											>
												Clave ya configurada (dejar vacio para mantener)
											</span>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Facturacion Automatica */}
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
								className="flex items-center justify-between"
								style={{
									padding: "14px 20px",
									borderBottom: "1px solid var(--s3)",
									background: "var(--s2)",
								}}
							>
								<div className="flex items-center gap-2.5">
									<Zap size={14} style={{ color: "var(--gold)" }} />
									<span
										className="font-display uppercase"
										style={{
											fontSize: 11,
											letterSpacing: "0.15em",
											color: "#ccc",
											fontWeight: 600,
										}}
									>
										FACTURACION AUTOMATICA
									</span>
								</div>
							</div>
							<div style={{ padding: 20 }}>
								<p
									className="font-body"
									style={{
										fontSize: 11,
										marginBottom: 16,
										lineHeight: 1.5,
										color: "#666",
									}}
								>
									Elegi que medios de pago generan factura automaticamente al
									cerrar una orden. Las que no esten activadas se pueden
									facturar manualmente desde la seccion Facturacion.
								</p>
								<div className="flex flex-col gap-3">
									<Toggle
										value={autoInvoiceMP}
										onChange={setAutoInvoiceMP}
										label="MercadoPago — Facturar automaticamente"
										icon={Smartphone}
									/>
									<Toggle
										value={autoInvoiceCash}
										onChange={setAutoInvoiceCash}
										label="Efectivo — Facturar automaticamente"
										icon={Banknote}
									/>
									<Toggle
										value={autoInvoiceCard}
										onChange={setAutoInvoiceCard}
										label="Tarjeta — Facturar automaticamente"
										icon={CreditCard}
									/>
								</div>
							</div>
						</div>

						{/* Info */}
						<div
							style={{
								background: "var(--s1)",
								border: "1px solid rgba(59,130,246,0.2)",
								borderRadius: 16,
								overflow: "hidden",
								boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
							}}
						>
							<div
								className="flex items-center justify-between"
								style={{
									padding: "14px 20px",
									borderBottom: "1px solid rgba(59,130,246,0.15)",
									background: "rgba(59,130,246,0.04)",
								}}
							>
								<div className="flex items-center gap-2.5">
									<Settings size={14} style={{ color: "#3b82f6" }} />
									<span
										className="font-display uppercase"
										style={{
											fontSize: 11,
											letterSpacing: "0.15em",
											color: "#3b82f6",
											fontWeight: 600,
										}}
									>
										COMO OBTENER EL CERTIFICADO
									</span>
								</div>
							</div>
							<div style={{ padding: 20 }}>
								<ol
									className="font-body"
									style={{
										fontSize: 11,
										lineHeight: 1.8,
										paddingLeft: 16,
										margin: 0,
										color: "#888",
									}}
								>
									<li>Ingresa a AFIP con tu CUIT y clave fiscal</li>
									<li>
										Anda a &ldquo;Administracion de Certificados
										Digitales&rdquo;
									</li>
									<li>
										Crea un nuevo certificado para &ldquo;Web Service&rdquo;
									</li>
									<li>Descarga el .pem y pega el contenido arriba</li>
									<li>Genera la clave privada (.key) y pegala tambien</li>
								</ol>
							</div>
						</div>
					</div>
				</div>

				{/* Save bar */}
				<div
					className="flex items-center gap-3 justify-end"
					style={{
						padding: "20px 0 0",
						marginTop: 28,
						borderTop: "1px solid var(--s3)",
					}}
				>
					{saved && (
						<div className="flex items-center gap-1.5 animate-fade-in">
							<CheckCircle2 size={14} style={{ color: "#10b981" }} />
							<span
								className="font-body"
								style={{ fontSize: 12, color: "#10b981" }}
							>
								Guardado
							</span>
						</div>
					)}
					<button
						className="btn-primary flex items-center gap-2"
						onClick={handleSave}
						disabled={saving}
					>
						{saving ? (
							<span className="font-display" style={{ fontSize: 11 }}>
								Guardando...
							</span>
						) : (
							<>
								<Save size={14} />
								<span className="font-display" style={{ fontSize: 11 }}>
									Guardar Configuracion
								</span>
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
