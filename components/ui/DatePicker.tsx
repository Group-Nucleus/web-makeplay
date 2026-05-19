'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function toDDMMYYYY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function parseDDMMYYYY(s: string): Date | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return isNaN(d.getTime()) ? null : d;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: Date;
}

export function DatePicker({ value, onChange, placeholder = 'DD/MM/AAAA', className = '', minDate }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const min = minDate ?? today;

  const parsed = parseDDMMYYYY(value);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState<Date>(() => {
    if (parsed) return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    return new Date(min.getFullYear(), min.getMonth(), 1);
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const prevMonth = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const nextMonth = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));

  const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const startOffset = firstDay.getDay();

  const select = (day: number) => {
    const d = new Date(cursor.getFullYear(), cursor.getMonth(), day);
    onChange(toDDMMYYYY(d));
    setOpen(false);
  };

  const isDisabled = (day: number) => {
    const d = new Date(cursor.getFullYear(), cursor.getMonth(), day);
    d.setHours(0, 0, 0, 0);
    return d < min;
  };

  const isSelected = (day: number) => {
    if (!parsed) return false;
    return (
      parsed.getDate() === day &&
      parsed.getMonth() === cursor.getMonth() &&
      parsed.getFullYear() === cursor.getFullYear()
    );
  };

  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === cursor.getMonth() &&
    today.getFullYear() === cursor.getFullYear();

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-xl border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white transition-colors hover:border-[#555] focus:outline-none focus:ring-2 focus:ring-lime/40">
        <CalendarDays className="h-4 w-4 shrink-0 text-lime" />
        <span className={value ? 'flex-1 text-left' : 'flex-1 text-left text-[#555]'}>
          {value || placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[200] mt-1 w-72 rounded-2xl border border-[#333] bg-[#0d0d0d] p-4 shadow-xl">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg p-1 text-muted hover:text-white">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-white">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg p-1 text-muted hover:text-white">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {WEEKDAYS.map((w, i) => (
              <span key={i} className="text-[11px] font-bold text-muted">
                {w}
              </span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {Array.from({ length: startOffset }).map((_, i) => (
              <span key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const disabled = isDisabled(day);
              const selected = isSelected(day);
              const tod = isToday(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => select(day)}
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors
                    ${selected ? 'bg-lime font-bold text-black' : ''}
                    ${!selected && tod ? 'ring-1 ring-lime text-lime' : ''}
                    ${!selected && !tod && !disabled ? 'text-white hover:bg-[#222]' : ''}
                    ${disabled ? 'cursor-not-allowed text-[#444]' : ''}
                  `}>
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          {!isDisabled(today.getDate()) &&
            today.getMonth() === cursor.getMonth() &&
            today.getFullYear() === cursor.getFullYear() && (
              <button
                type="button"
                onClick={() => select(today.getDate())}
                className="mt-3 w-full rounded-lg py-1.5 text-xs font-semibold text-lime hover:bg-lime/10">
                Hoje
              </button>
            )}
        </div>
      )}
    </div>
  );
}
