export default function StatCard({
  label,
  value,
  color = "text-primary",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-border-card bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
