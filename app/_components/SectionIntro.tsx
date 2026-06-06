import type { ReactNode } from "react";

/** Small explainer card shown at the top of each variant page. */
export function SectionIntro({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-5">
      <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
      <div className="text-sm leading-relaxed text-zinc-600">{children}</div>
    </div>
  );
}
