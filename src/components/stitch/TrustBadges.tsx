const badges = [
  { icon: "verified", label: "Melhor tarifa" },
  { icon: "event_available", label: "Cancelamento flexível" },
  { icon: "support_agent", label: "Suporte 24/7" },
];

export default function TrustBadges() {
  return (
    <section className="mt-8 px-6">
      <div className="flex overflow-x-auto hide-scrollbar gap-6 pb-4 snap-x">
        {badges.map((badge) => (
          <div
            key={badge.icon}
            className="flex items-center gap-2 shrink-0 snap-start"
          >
            <span
              className="material-symbols-outlined text-accent text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {badge.icon}
            </span>
            <span className="text-[13px] font-medium text-text-muted">
              {badge.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
