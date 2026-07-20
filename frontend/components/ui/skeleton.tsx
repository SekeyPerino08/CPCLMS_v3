export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-zinc-200 ${className || ""}`} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
      <div className="flex justify-between">
