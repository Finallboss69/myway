"use client";

import { useState, useEffect } from "react";
import {
	Smartphone,
	Save,
	CheckCircle2,
	AlertCircle,
	Eye,
	EyeOff,
	ExternalLink,
	Loader2,
} from "lucide-react";

interface SettingRow {
	key: string;
	value: string;
	updatedAt?: string;
}

const FIELDS = [
	{
		key: "mp_access_token",
		label: "Access Token",
		placeholder: "APP_USR-...",
		help: "Token de producción de tu aplicación de MercadoPago",
		secret: true,
	},
	{
		key: "mp_user_id",
		label: "User ID (Collector)",
		placeholder: "123456789",
		help: "Tu ID de usuario/vendedor de MercadoPago",
		secret: false,
	},
	{
		key: "mp_external_pos_id",
		label: "External POS ID",
		placeholder: "MYWAY-POS-1",
		help: "ID externo del punto de venta (creado en MercadoPago)",
		secret: false,
	},
] as const;

export default function MercadoPagoSettingsPage() {
	const [values, setValues] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState<string | null>(null);
	const [saved, setSaved] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showToken, setShowToken] = useState(false);

	useEffect(() => {
		fetch("/api/settings")
			.then((r) => r.json())
			.then((data: SettingRow[]) => {
				const map: Record<string, string> = {};
				for (const row of data) map[row.key] = row.value;
				setValues(map);
			})
			.catch(() => setError("Error al cargar configuración"))
			.finally(() => setLoading(false));
	}, []);

	const handleSave = async (key: string) => {
		const value = values[key];
		if (!value?.trim()) return;
		setSaving(key);
		setError(null);
		setSaved(null);
		try {
			const res = await fetch("/api/settings", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ key, value: value.trim() }),
			});
			if (!res.ok) {
				const data = await res.json();
				setError(data.error ?? "Error al guardar");
				return;
			}
			const data = await res.json();
			setValues((prev) => ({ ...prev, [key]: data.value }));
			setSaved(key);
			setTimeout(() => setSaved(null), 2000);
		} catch {
			setError("Error de conexión");
		} finally {
			setSaving(null);
		}
	};

	const allConfigured = FIELDS.every(
		(f) => values[f.key] && values[f.key].length > 0,
	);

	return (
		<div className="p-6 max-w-2xl">
			{/* Header */}
			<div className="flex items-center gap-3 mb-6">
				<div
					className="w-10 h-10 rounded-xl flex items-center justify-center"
					style={{
						background: "rgba(0,158,227,0.12)",
						border: "1px solid rgba(0,158,227,0.3)",
					}}
				>
					<Smartphone size={20} style={{ color: "#009ee3" }} />
				</div>
				<div>
					<h1 className="font-display text-lg font-bold text-ink-primary">
						MercadoPago
					</h1>
					<p className="font-body text-xs text-ink-tertiary">
						Configurá tus credenciales para cobrar con QR
					</p>
				</div>
			</div>

			{/* Status badge */}
			<div
				className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6"
				style={{
					background: allConfigured
						? "rgba(16,185,129,0.08)"
						: "rgba(245,158,11,0.08)",
					border: allConfigured
						? "1px solid rgba(16,185,129,0.25)"
						: "1px solid rgba(245,158,11,0.25)",
				}}
			>
				{allConfigured ? (
					<CheckCircle2 size={16} className="text-emerald-400" />
				) : (
					<AlertCircle size={16} className="text-amber-400" />
				)}
				<span
					className="font-display text-xs font-semibold"
					style={{ color: allConfigured ? "#34d399" : "#fbbf24" }}
				>
					{allConfigured
						? "MercadoPago configurado correctamente"
						: "Completá todos los campos para activar pagos con QR"}
				</span>
			</div>

			{error && (
				<div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 bg-red-500/10 border border-red-500/25">
					<AlertCircle size={14} className="text-red-400" />
					<span className="font-display text-xs text-red-400">{error}</span>
				</div>
			)}

			{loading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="w-6 h-6 text-ink-tertiary animate-spin" />
				</div>
			) : (
				<div className="flex flex-col gap-4">
					{FIELDS.map((field) => (
						<div
							key={field.key}
							className="card overflow-hidden"
							style={{ padding: 0 }}
						>
							<div
								className="px-4 py-3 flex items-center justify-between"
								style={{
									background: "var(--s2)",
									borderBottom: "1px solid var(--s3)",
								}}
							>
								<div>
									<span className="font-display text-sm font-bold text-ink-primary">
										{field.label}
									</span>
									<p className="font-body text-[11px] text-ink-tertiary mt-0.5">
										{field.help}
									</p>
								</div>
								{saved === field.key && (
									<CheckCircle2
										size={16}
										className="text-emerald-400 animate-fade-in"
									/>
								)}
							</div>
							<div className="px-4 py-3 flex gap-2">
								<div className="relative flex-1">
									<input
										type={field.secret && !showToken ? "password" : "text"}
										value={values[field.key] ?? ""}
										onChange={(e) =>
											setValues((prev) => ({
												...prev,
												[field.key]: e.target.value,
											}))
										}
										placeholder={field.placeholder}
										className="input-base w-full"
										style={{
											fontSize: 13,
											paddingRight: field.secret ? 36 : 12,
										}}
									/>
									{field.secret && (
										<button
											onClick={() => setShowToken(!showToken)}
											className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-secondary transition-colors"
											type="button"
										>
											{showToken ? <EyeOff size={14} /> : <Eye size={14} />}
										</button>
									)}
								</div>
								<button
									onClick={() => handleSave(field.key)}
									disabled={saving === field.key || !values[field.key]?.trim()}
									className="btn-primary shrink-0"
									style={{ padding: "8px 16px", fontSize: 12 }}
								>
									{saving === field.key ? (
										<Loader2 size={14} className="animate-spin" />
									) : (
										<Save size={14} />
									)}
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Help section */}
			<div
				className="mt-6 px-4 py-4 rounded-xl"
				style={{
					background: "var(--s2)",
					border: "1px solid var(--s3)",
				}}
			>
				<h3 className="font-display text-xs font-bold text-ink-secondary mb-2 uppercase tracking-widest">
					Cómo obtener las credenciales
				</h3>
				<ol className="flex flex-col gap-2 font-body text-xs text-ink-tertiary">
					<li>
						1. Ingresá a{" "}
						<a
							href="https://www.mercadopago.com.ar/developers/panel/app"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-400 hover:underline inline-flex items-center gap-1"
						>
							MercadoPago Developers <ExternalLink size={10} />
						</a>
					</li>
					<li>2. Creá una aplicación (o usá una existente)</li>
					<li>
						3. En &quot;Credenciales de producción&quot;, copiá el{" "}
						<strong className="text-ink-secondary">Access Token</strong>
					</li>
					<li>
						4. Tu <strong className="text-ink-secondary">User ID</strong> lo
						encontrás en la URL de tu perfil o en la API de credenciales
					</li>
					<li>
						5. Creá un{" "}
						<strong className="text-ink-secondary">Punto de Venta (POS)</strong>{" "}
						desde la API de Sucursales y Cajas
					</li>
				</ol>
			</div>
		</div>
	);
}
