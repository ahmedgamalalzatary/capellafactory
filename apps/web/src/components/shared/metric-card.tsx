type MetricCardProps = {
  label: string;
  value: string;
  tone: "paper" | "slate" | "amber";
};

const theme = {
  paper: {
    background: "rgba(255,255,255,0.74)",
    borderColor: "rgba(148, 163, 184, 0.20)",
    text: "text-slate-950",
    subtext: "text-slate-500",
  },
  slate: {
    background: "rgba(241, 245, 249, 0.86)",
    borderColor: "rgba(148, 163, 184, 0.26)",
    text: "text-slate-900",
    subtext: "text-slate-500",
  },
  amber: {
    background: "rgba(254, 243, 199, 0.62)",
    borderColor: "rgba(217, 119, 6, 0.18)",
    text: "text-amber-950",
    subtext: "text-amber-800/70",
  },
} as const;

export function MetricCard({ label, value, tone }: MetricCardProps) {
  return (
    <div
      className="rounded-[22px] border px-4 py-4 sm:px-5"
      style={{
        background: theme[tone].background,
        borderColor: theme[tone].borderColor,
      }}
    >
      <p className={`text-[11px] font-medium uppercase tracking-[0.18em] ${theme[tone].subtext}`}>
        {label}
      </p>
      <p className={`mt-3 text-[28px] font-bold leading-none ${theme[tone].text}`}>{value}</p>
    </div>
  );
}
