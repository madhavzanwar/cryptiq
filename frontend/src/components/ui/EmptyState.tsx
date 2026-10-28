import type { ReactNode } from "react";

/** Centered empty state: icon, heading, one sentence, one action. (Centered text is allowed only here.) */
export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-[13px] rounded-card border border-carbon bg-pure-white px-[26px] py-[53px] text-center">
      {icon && <div className="text-carbon [&_svg]:size-8">{icon}</div>}
      <h3 className="sub">{title}</h3>
      {children && <p className="measure text-ash-gray">{children}</p>}
      {action && <div className="mt-[9px]">{action}</div>}
    </div>
  );
}
