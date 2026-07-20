const variantes = {
  danger: {
    bg: "bg-danger-bg",
    border: "border-danger",
    icon: "text-danger",
    title: "text-danger",
    body: "text-danger/80",
  },
  warning: {
    bg: "bg-warning-bg",
    border: "border-warning",
    icon: "text-warning",
    title: "text-warning",
    body: "text-warning/80",
  },
  info: {
    bg: "bg-info-bg",
    border: "border-info",
    icon: "text-info",
    title: "text-info",
    body: "text-info/80",
  },
};

export default function AlertBanner({
  variant = "danger",
  title,
  children,
}: {
  variant?: "danger" | "warning" | "info";
  title: string;
  children: React.ReactNode;
}) {
  const v = variantes[variant];
  return (
    <div className={`rounded-lg border-2 ${v.bg} ${v.border} p-4`}>
      <div className="flex items-start gap-3">
        <svg className={`mt-0.5 h-5 w-5 shrink-0 ${v.icon}`} viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <h3 className={`text-sm font-bold ${v.title}`}>{title}</h3>
          <div className={`mt-1 text-sm font-semibold ${v.body}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
