interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  description?: string;
  trend?: { value: string; positive: boolean };
  variant?: "default" | "emerald" | "blue" | "amber";
}

export function StatCard({ title, value, icon, description, trend, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "bg-white border-zinc-200",
    emerald: "bg-emerald-50 border-emerald-200",
    blue: "bg-blue-50 border-blue-200",
    amber: "bg-amber-50 border-amber-200",
  };

  return (
    <div className={`rounded-xl border p-5 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            trend.positive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          }`}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-zinc-800 mb-1">{value}</p>
      <p className="text-sm text-zinc-500">{title}</p>
      {description && <p className="text-xs text-zinc-400 mt-1">{description}</p>}
    </div>
  );
}
