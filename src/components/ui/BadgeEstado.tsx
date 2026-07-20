const estadoColores: Record<string, { bg: string; text: string; border: string }> = {
  COMPLETADA:       { bg: "bg-positive-bg", text: "text-positive", border: "border-positive/30" },
  DISPONIBLE:       { bg: "bg-positive-bg", text: "text-positive", border: "border-positive/30" },
  PAGADA:           { bg: "bg-positive-bg", text: "text-positive", border: "border-positive/30" },
  DISPENSADA:       { bg: "bg-positive-bg", text: "text-positive", border: "border-positive/30" },
  ENVIADA:          { bg: "bg-positive-bg", text: "text-positive", border: "border-positive/30" },
  PENDIENTE:        { bg: "bg-warning-bg", text: "text-warning", border: "border-warning/30" },
  EN_ESPERA:        { bg: "bg-warning-bg", text: "text-warning", border: "border-warning/30" },
  STOCK_BAJO:       { bg: "bg-warning-bg", text: "text-warning", border: "border-warning/30" },
  POR_VENCER:       { bg: "bg-warning-bg", text: "text-warning", border: "border-warning/30" },
  PARCIAL:          { bg: "bg-warning-bg", text: "text-warning", border: "border-warning/30" },
  EN_LIMPIEZA:      { bg: "bg-warning-bg", text: "text-warning", border: "border-warning/30" },
  SOLICITADO:       { bg: "bg-warning-bg", text: "text-warning", border: "border-warning/30" },
  CANCELADA:        { bg: "bg-danger-bg", text: "text-danger", border: "border-danger/30" },
  ANULADA:          { bg: "bg-danger-bg", text: "text-danger", border: "border-danger/30" },
  RECHAZADA:        { bg: "bg-danger-bg", text: "text-danger", border: "border-danger/30" },
  EN_PROCESO:       { bg: "bg-info-bg", text: "text-info", border: "border-info/30" },
  CONFIRMADA:       { bg: "bg-info-bg", text: "text-info", border: "border-info/30" },
  ACTIVA:           { bg: "bg-info-bg", text: "text-info", border: "border-info/30" },
  EN_CURSO:         { bg: "bg-info-bg", text: "text-info", border: "border-info/30" },
  PROCESANDO:       { bg: "bg-info-bg", text: "text-info", border: "border-info/30" },
  ALTA:             { bg: "bg-muted-bg", text: "text-muted", border: "border-muted/30" },
  CERRADA:          { bg: "bg-muted-bg", text: "text-muted", border: "border-muted/30" },
  VENCIDO:          { bg: "bg-muted-bg", text: "text-muted", border: "border-muted/30" },
};

const fallback = { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" };

export default function BadgeEstado({ estado }: { estado: string }) {
  const key = estado?.toUpperCase().replace(/\s+/g, "_") ?? "";
  const colores = estadoColores[key] ?? fallback;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colores.bg} ${colores.text} ${colores.border}`}>
      {estado}
    </span>
  );
}
