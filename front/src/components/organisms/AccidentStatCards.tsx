import { formatNumber } from "@/utils/formatters";

interface AccidentStatCardsProps {
  totalCount: number;
  filteredCount: number;
  currentPage: number;
  pageSize: number;
}

const AccidentStatCards: React.FC<AccidentStatCardsProps> = ({
  totalCount,
  filteredCount,
  currentPage,
  pageSize,
}) => {
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
  const rangeStart =
    filteredCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(filteredCount, currentPage * pageSize);
  const hasFilters = filteredCount !== totalCount;

  const cards = [
    {
      label: "کل تصادفات",
      value: formatNumber(totalCount),
      hint: "ثبت‌شده در سامانه",
      tone: "tint-blue",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      ),
    },
    {
      label: "نتایج این جستجو",
      value: formatNumber(filteredCount),
      hint: hasFilters ? `از ${formatNumber(totalCount)} تصادف` : "بدون فیلتر",
      tone: "tint-amber",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M3 4a1 1 0 011-1h16a1 1 0 01.8 1.6l-6.3 8.4V19a1 1 0 01-1.45.9l-3-1.5A1 1 0 0110 17.5v-4.5L3.2 4.6A1 1 0 013 4z"
        />
      ),
    },
    {
      label: "صفحه جاری",
      value: formatNumber(currentPage),
      hint: `از ${formatNumber(totalPages)} صفحه`,
      tone: "tint-emerald",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M4 7h16M4 12h16M4 17h16"
        />
      ),
    },
    {
      label: "بازه نمایش",
      value:
        filteredCount === 0
          ? "—"
          : `${formatNumber(rangeStart)} تا ${formatNumber(rangeEnd)}`,
      hint: "در این صفحه",
      tone: "tint-violet",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M4 6h16M4 12h10M4 18h6"
        />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.tone} rounded-2xl border border-line bg-surface p-5 shadow-sm transition-shadow hover:shadow-md`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-fg-muted">{card.label}</p>
              <p className="mt-2 truncate text-2xl font-bold text-fg">
                {card.value}
              </p>
              <p className="mt-1 truncate text-xs text-fg-faint">{card.hint}</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tint-strong text-tint-fg">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {card.icon}
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AccidentStatCards;
