import { cn } from "@/lib/utils";

export function Table({ className, children }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)}>{children}</table>
    </div>
  );
}

export function TableHeader({ className, children }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-zinc-50 [&_tr]:border-b", className)}>{children}</thead>;
}

export function TableBody({ className, children }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)}>{children}</tbody>;
}

export function TableRow({ className, children }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("border-b border-zinc-100 transition-colors hover:bg-zinc-50", className)}>{children}</tr>;
}

export function TableHead({ className, children }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("h-10 px-4 text-left align-middle font-medium text-zinc-500", className)}>{children}</th>;
}

export function TableCell({ className, children }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("p-4 align-middle", className)}>{children}</td>;
}
