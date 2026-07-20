export default function Table({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border-card bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-card bg-slate-100">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left font-medium text-text-secondary">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-card">{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({
  children,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`hover:bg-slate-50 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 text-text-primary ${className}`}>{children}</td>;
}
