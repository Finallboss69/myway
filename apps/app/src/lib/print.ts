/**
 * Print utility for My Way admin panel.
 * Opens a print-friendly window with styled content.
 */

export interface PrintOptions {
	title: string;
	subtitle?: string;
	content: string; // HTML string
}

export function printDocument({ title, subtitle, content }: PrintOptions) {
	const win = window.open("", "_blank");
	if (!win) return;

	win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title} — My Way Olivos</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DM Sans', sans-serif; padding: 32px; color: #1a1a1a; font-size: 12px; line-height: 1.5; }
    .header { border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
    .header .subtitle { font-size: 11px; color: #666; }
    .header .date { font-size: 10px; color: #999; text-align: right; }
    .header .brand { font-family: 'Syne', sans-serif; font-size: 10px; color: #999; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th { text-align: left; font-family: 'Syne', sans-serif; font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: #666; border-bottom: 1px solid #ddd; padding: 6px 8px; }
    td { padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 12px; }
    tr:last-child td { border-bottom: none; }
    .amount { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
    .total-row { font-weight: 700; border-top: 2px solid #333; }
    .total-row td { padding-top: 10px; }
    .section-title { font-family: 'Syne', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #666; margin: 20px 0 8px; }
    .stat-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .stat-label { color: #666; }
    .stat-value { font-weight: 700; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 9px; color: #999; text-align: center; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${title}</h1>
      ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
    </div>
    <div>
      <div class="date">${new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}</div>
      <div class="brand">MY WAY OLIVOS</div>
    </div>
  </div>
  ${content}
  <div class="footer">My Way Olivos — Maipú 3825, Olivos — Generado el ${new Date().toLocaleString("es-AR")}</div>
</body>
</html>`);
	win.document.close();
	setTimeout(() => win.print(), 500);
}

/** Format currency for print */
export function printCurrency(n: number): string {
	return (
		"$ " +
		n.toLocaleString("es-AR", {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		})
	);
}
