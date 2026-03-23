"use client";

import { useState, useEffect, useCallback } from "react";
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

	// Form state
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
			setError("Error cargando configuración");
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
			setError("Error guardando configuración");
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
			className="flex items-center gap-3 w-full rounded-xl transition-colors"
			style={{
				padding: "14px 16px",
				background: value ? "rgba(245,158,11,0.08)" : "var(--s2)",
				border: `1px solid ${value ? "rgba(245,158,11,0.3)" : "var(--s3)"}`,
			}}
		>
			<Icon
				size={18}
				style={{ color: value ? "var(--gold)" : "var(--ink-tertiary)" }}
			/>
			<span
				className="font-body flex-1 text-left"
				style={{
					fontSize: 13,
					color: value ? "var(--ink-primary)" : "var(--ink-secondary)",
				}}
			>
				{label}
			</span>
			{value ? (
				<ToggleRight size={22} style={{ color: "var(--gold)" }} />
			) : (
				<ToggleLeft size={22} style={{ color: "var(--ink-disabled)" }} />
			)}
		</button>
	);

	if (loading) {
		return (
			<div
				className="flex items-center justify-center"
				style={{ minHeight: "60vh" }}
			>
				<div
					className="font-display text-ink-tertiary"
					style={{ fontSize: 13 }}
				>
					Cargando configuración...
				</div>
			</div>
		);
	}

	return (
		<div style={{ padding: "24px 20px 60px", maxWidth: 900, margin: "0 auto" }}>
			{/* Header */}
			<div
				className="flex items-center gap-4 flex-wrap"
				style={{ marginBottom: 28 }}
			>
				<div
					className="flex items-center justify-center"
					style={{
						width: 44,
						height: 44,
						borderRadius: 12,
						background: "rgba(245,158,11,0.12)",
						border: "1px solid rgba(245,158,11,0.25)",
					}}
				>
					<Settings size={22} style={{ color: "var(--gold)" }} />
				</div>
				<div>
					<h1
						className="font-kds text-ink-primary"
						style={{ fontSize: 40, lineHeight: 1 }}
					>
						CONFIGURACIÓN AFIP
					</h1>
					<p
						className="font-body text-ink-tertiary"
						style={{ fontSize: 12, marginTop: 2 }}
					>
						Facturación electrónica y reglas de facturación automática
					</p>
				</div>
				{config?.certPem === "***configured***" && (
					<div
						className="badge flex items-center gap-1.5"
						style={{
							background: "rgba(16,185,129,0.1)",
							border: "1px solid rgba(16,185,129,0.3)",
							color: "#10b981",
							marginLeft: "auto",
						}}
					>
						<Shield size={11} />
						Certificado Configurado
					</div>
				)}
			</div>

			{error && (
				<div
					className="card flex items-center gap-2"
					style={{
						marginBottom: 16,
						padding: "12px 16px",
						borderColor: "rgba(239,68,68,0.3)",
						background: "rgba(239,68,68,0.05)",
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

			{/* Datos Fiscales */}
			<section style={{ marginBottom: 28 }}>
				<div
					className="font-display text-ink-disabled uppercase"
					style={{ fontSize: 9, letterSpacing: "0.25em", marginBottom: 12 }}
				>
					DATOS FISCALES
				</div>
				<div className="card" style={{ padding: 20 }}>
					<div
						className="grid gap-4"
						style={{
							gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
						}}
					>
						<div>
							<label
								className="font-display text-ink-tertiary uppercase block"
								style={{ fontSize: 9, letterSpacing: "0.2em", marginBottom: 6 }}
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
								className="font-display text-ink-tertiary uppercase block"
								style={{ fontSize: 9, letterSpacing: "0.2em", marginBottom: 6 }}
							>
								Razón Social
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
								className="font-display text-ink-tertiary uppercase block"
								style={{ fontSize: 9, letterSpacing: "0.2em", marginBottom: 6 }}
							>
								Punto de Venta
							</label>
							<input
								className="input-base w-full"
								type="number"
								min={1}
								value={puntoVenta}
								onChange={(e) => setPuntoVenta(parseInt(e.target.value) || 1)}
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Régimen Tributario */}
			<section style={{ marginBottom: 28 }}>
				<div
					className="font-display text-ink-disabled uppercase"
					style={{ fontSize: 9, letterSpacing: "0.25em", marginBottom: 12 }}
				>
					RÉGIMEN TRIBUTARIO
				</div>
				<div
					className="grid gap-3"
					style={{
						gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
					}}
				>
					{TAX_REGIMES.map((r) => (
						<button
							key={r.value}
							type="button"
							onClick={() => setTaxRegime(r.value)}
							className="card text-left transition-colors"
							style={{
								padding: "16px 18px",
								cursor: "pointer",
								borderColor:
									taxRegime === r.value ? "rgba(245,158,11,0.4)" : "var(--s3)",
								background:
									taxRegime === r.value ? "rgba(245,158,11,0.06)" : undefined,
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
											taxRegime === r.value ? "var(--gold)" : "var(--s4)",
									}}
								/>
								<span
									className="font-display text-ink-primary"
									style={{ fontSize: 13, fontWeight: 600 }}
								>
									{r.label}
								</span>
							</div>
							<p
								className="font-body text-ink-tertiary"
								style={{ fontSize: 11, lineHeight: 1.4 }}
							>
								{r.desc}
							</p>
						</button>
					))}
				</div>
			</section>

			{/* Entorno */}
			<section style={{ marginBottom: 28 }}>
				<div
					className="font-display text-ink-disabled uppercase"
					style={{ fontSize: 9, letterSpacing: "0.25em", marginBottom: 12 }}
				>
					ENTORNO
				</div>
				<div className="flex gap-3">
					{(["testing", "production"] as const).map((env) => (
						<button
							key={env}
							type="button"
							onClick={() => setEnvironment(env)}
							className="card flex items-center gap-2 transition-colors"
							style={{
								padding: "12px 20px",
								cursor: "pointer",
								borderColor:
									environment === env
										? env === "production"
											? "rgba(16,185,129,0.4)"
											: "rgba(245,158,11,0.4)"
										: "var(--s3)",
								background:
									environment === env
										? env === "production"
											? "rgba(16,185,129,0.06)"
											: "rgba(245,158,11,0.06)"
										: undefined,
							}}
						>
							<div
								style={{
									width: 8,
									height: 8,
									borderRadius: "50%",
									background:
										environment === env
											? env === "production"
												? "#10b981"
												: "var(--gold)"
											: "var(--s4)",
								}}
							/>
							<span
								className="font-display uppercase"
								style={{
									fontSize: 11,
									letterSpacing: "0.15em",
									color:
										environment === env
											? "var(--ink-primary)"
											: "var(--ink-tertiary)",
								}}
							>
								{env === "testing" ? "Homologación" : "Producción"}
							</span>
						</button>
					))}
				</div>
				{environment === "production" && (
					<div
						className="flex items-center gap-2 mt-2"
						style={{ padding: "8px 12px" }}
					>
						<AlertTriangle size={12} style={{ color: "#f59e0b" }} />
						<span
							className="font-body"
							style={{ fontSize: 11, color: "#f59e0b" }}
						>
							Las facturas emitidas en producción son fiscalmente válidas
						</span>
					</div>
				)}
			</section>

			{/* Certificados */}
			<section style={{ marginBottom: 28 }}>
				<div
					className="font-display text-ink-disabled uppercase"
					style={{ fontSize: 9, letterSpacing: "0.25em", marginBottom: 12 }}
				>
					CERTIFICADOS AFIP
				</div>
				<div className="card" style={{ padding: 20 }}>
					<div className="grid gap-4">
						<div>
							<label
								className="font-display text-ink-tertiary uppercase block"
								style={{ fontSize: 9, letterSpacing: "0.2em", marginBottom: 6 }}
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
									className="font-body text-green-500"
									style={{ fontSize: 10, marginTop: 4, display: "block" }}
								>
									Certificado ya configurado (dejar vacío para mantener)
								</span>
							)}
						</div>
						<div>
							<label
								className="font-display text-ink-tertiary uppercase block"
								style={{ fontSize: 9, letterSpacing: "0.2em", marginBottom: 6 }}
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
									className="font-body text-green-500"
									style={{ fontSize: 10, marginTop: 4, display: "block" }}
								>
									Clave ya configurada (dejar vacío para mantener)
								</span>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* Facturación Automática */}
			<section style={{ marginBottom: 32 }}>
				<div
					className="font-display text-ink-disabled uppercase"
					style={{ fontSize: 9, letterSpacing: "0.25em", marginBottom: 12 }}
				>
					FACTURACIÓN AUTOMÁTICA
				</div>
				<p
					className="font-body text-ink-tertiary"
					style={{ fontSize: 11, marginBottom: 12, lineHeight: 1.5 }}
				>
					Elegí qué medios de pago generan factura automáticamente al cerrar una
					orden. Las que no estén activadas se pueden facturar manualmente desde
					la sección Facturación.
				</p>
				<div className="grid gap-3">
					<Toggle
						value={autoInvoiceMP}
						onChange={setAutoInvoiceMP}
						label="MercadoPago — Facturar automáticamente"
						icon={Smartphone}
					/>
					<Toggle
						value={autoInvoiceCash}
						onChange={setAutoInvoiceCash}
						label="Efectivo — Facturar automáticamente"
						icon={Banknote}
					/>
					<Toggle
						value={autoInvoiceCard}
						onChange={setAutoInvoiceCard}
						label="Tarjeta — Facturar automáticamente"
						icon={CreditCard}
					/>
				</div>
			</section>

			{/* Save */}
			<div
				className="flex items-center gap-3 justify-end"
				style={{
					padding: "16px 0",
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
								Guardar Configuración
							</span>
						</>
					)}
				</button>
			</div>

			{/* Info */}
			<div
				className="card"
				style={{
					padding: 16,
					marginTop: 16,
					borderColor: "rgba(59,130,246,0.2)",
					background: "rgba(59,130,246,0.03)",
				}}
			>
				<div className="flex items-start gap-3">
					<FileText
						size={16}
						style={{ color: "#3b82f6", flexShrink: 0, marginTop: 2 }}
					/>
					<div>
						<p
							className="font-display text-ink-secondary"
							style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}
						>
							¿Cómo obtener el certificado?
						</p>
						<ol
							className="font-body text-ink-tertiary"
							style={{
								fontSize: 11,
								lineHeight: 1.6,
								paddingLeft: 16,
								margin: 0,
							}}
						>
							<li>Ingresá a AFIP con tu CUIT y clave fiscal</li>
							<li>
								Andá a &ldquo;Administración de Certificados Digitales&rdquo;
							</li>
							<li>Creá un nuevo certificado para &ldquo;Web Service&rdquo;</li>
							<li>Descargá el .pem y pegá el contenido arriba</li>
							<li>Generá la clave privada (.key) y pegala también</li>
						</ol>
					</div>
				</div>
			</div>
		</div>
	);
}
