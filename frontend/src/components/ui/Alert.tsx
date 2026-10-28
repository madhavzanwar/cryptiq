import { cn } from "@/lib/cn";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

export type AlertTone = "info" | "success" | "warning" | "error";

const tones: Record<AlertTone, { cls: string; icon: typeof Info }> = {
  info: { cls: "bg-powder-blue text-carbon", icon: Info },
  success: { cls: "bg-allow-tint text-allow-ink", icon: CircleCheck },
  warning: { cls: "bg-warn-tint text-warn-ink", icon: TriangleAlert },
  error: { cls: "bg-block-tint text-block-ink", icon: CircleAlert },
};

/** Always icon + text (never colour alone). Errors announce themselves politely to screen readers. */
export function Alert({ tone = "info", title, children, action, className }: { tone?: AlertTone; title?: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  const { cls, icon: Icon } = tones[tone];
  return (
    <div role={tone === "error" || tone === "warning" ? "alert" : "status"} className={cn("flex gap-[13px] rounded-card px-[26px] py-[18px] text-body-lg", cls, className)}>
      <Icon className="mt-[3px] size-6 flex-none" aria-hidden strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-1")}>{children}</div>}
      </div>
      {action && <div className="flex-none self-center">{action}</div>}
    </div>
  );
}
