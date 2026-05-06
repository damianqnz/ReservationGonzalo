"use client";

interface SearchDatesModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: (checkIn: string, checkOut: string) => void;
}

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

interface MonthData {
  label: string;
  year: number;
  month: number; // 0-indexed
  days: number;
  startDay: number; // 0=Sunday
  selectedStart?: number;
  selectedEnd?: number;
}

const months: MonthData[] = [
  {
    label: "Fevereiro 2026",
    year: 2026,
    month: 1,
    days: 28,
    startDay: 0,
    selectedStart: 12,
    selectedEnd: 15,
  },
  {
    label: "Março 2026",
    year: 2026,
    month: 2,
    days: 31,
    startDay: 0,
  },
];

function CalendarMonth({ data }: { data: MonthData }) {
  const emptyCells = data.startDay;
  const { selectedStart, selectedEnd } = data;
  const hasRange = selectedStart !== undefined && selectedEnd !== undefined;

  return (
    <section>
      <h2 className="text-base font-bold mb-4 sticky top-0 bg-white/95 backdrop-blur-sm py-2 z-10 text-center">
        {data.label}
      </h2>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-y-2 mb-2 text-center">
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            className="text-[13px] font-bold text-text-muted h-8 flex items-center justify-center"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-y-1 justify-items-center">
        {/* Empty slots */}
        {Array.from({ length: emptyCells }).map((_, i) => (
          <div key={`empty-${i}`} className="w-11 h-11" />
        ))}

        {/* Day cells */}
        {Array.from({ length: data.days }).map((_, i) => {
          const day = i + 1;
          const isStart = hasRange && day === selectedStart;
          const isEnd = hasRange && day === selectedEnd;
          const isInRange =
            hasRange && day > selectedStart! && day < selectedEnd!;

          if (isStart) {
            return (
              <div
                key={day}
                className="relative w-11 h-11 flex items-center justify-center w-full"
              >
                <div className="absolute inset-y-0 right-0 w-1/2 bg-surface" />
                <button className="relative w-11 h-11 flex items-center justify-center text-sm font-bold text-white bg-primary rounded-full z-10">
                  {day}
                </button>
              </div>
            );
          }

          if (isEnd) {
            return (
              <div
                key={day}
                className="relative w-11 h-11 flex items-center justify-center w-full"
              >
                <div className="absolute inset-y-0 left-0 w-1/2 bg-surface" />
                <button className="relative w-11 h-11 flex items-center justify-center text-sm font-bold text-white bg-primary rounded-full z-10">
                  {day}
                </button>
              </div>
            );
          }

          if (isInRange) {
            return (
              <div
                key={day}
                className="w-11 h-11 w-full bg-surface flex items-center justify-center"
              >
                <span className="text-sm font-medium">{day}</span>
              </div>
            );
          }

          return (
            <button
              key={day}
              className="w-11 h-11 flex items-center justify-center text-sm font-medium rounded-full hover:bg-surface transition-colors"
            >
              {day}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function SearchDatesModal({
  open,
  onClose,
}: SearchDatesModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white text-text-main flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-white px-6 py-4 border-b border-surface">
        <div className="w-10" />
        <h1 className="text-lg font-bold">Selecionar datas</h1>
        <button
          aria-label="Fechar"
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-text-main hover:bg-surface rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
      </header>

      {/* Calendar Content */}
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-md mx-auto px-4 py-6 space-y-8">
          {months.map((month) => (
            <CalendarMonth key={month.label} data={month} />
          ))}
        </div>
      </main>

      {/* Sticky Footer */}
      <footer className="absolute bottom-0 left-0 right-0 bg-white border-t border-surface shadow-soft p-4 px-6 z-20">
        <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto">
            <p className="text-sm text-text-muted mb-1">Datas selecionadas</p>
            <p className="text-base font-bold text-text-main">
              12 Fev - 15 Fev
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto min-w-[140px] h-12 bg-primary text-white font-semibold rounded-lg px-6 hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Confirmar
          </button>
        </div>
      </footer>
    </div>
  );
}
