import { Button } from "@/components/ui/button";

export function EmptyState(props: {
  icon?: string;
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{props.icon || "📭"}</span>
      <h3 className="text-lg font-semibold text-zinc-700 mb-1">{props.title}</h3>
      {props.description && <p className="text-sm text-zinc-500 max-w-sm mb-6">{props.description}</p>}
      {props.action && props.onAction && (
        <Button onClick={props.onAction}>{props.action}</Button>
      )}
    </div>
  );
}
