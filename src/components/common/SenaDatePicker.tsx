import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface SenaDatePickerProps {
  value: string; // ISO format: 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  label?: string;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
  showTodayShortcut?: boolean;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
}

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const WEEKDAY_NAMES_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const DAY_NAMES_FULL = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

// Helper: safe local date parser
function parseISODate(dateStr: string): Date {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date();
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Helper: format Date to YYYY-MM-DD
function formatToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const SenaDatePicker: React.FC<SenaDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Seleccionar fecha',
  size = 'md',
  align = 'left',
  className = '',
  style,
  showTodayShortcut = true,
  minDate,
  maxDate,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Current date in selection
  const selectedDate = useMemo(() => parseISODate(value), [value]);

  // Browsed month/year in the calendar view
  const [viewYear, setViewYear] = useState<number>(() => selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => selectedDate.getMonth());

  // Quick picker modes: 'days' | 'months' | 'years'
  const [pickerViewMode, setPickerViewMode] = useState<'days' | 'months' | 'years'>('days');

  // Sync view when value changes from outside
  useEffect(() => {
    if (value) {
      const parsed = parseISODate(value);
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setPickerViewMode('days');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setPickerViewMode('days');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Month navigation
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Select day
  const handleSelectDay = (dayDate: Date) => {
    const isoStr = formatToISO(dayDate);
    onChange(isoStr);
    setIsOpen(false);
    setPickerViewMode('days');
  };

  // Select Today
  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    onChange(formatToISO(today));
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
    setPickerViewMode('days');
  };

  // Generate calendar grid (42 days)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    // 0 = Sunday, 1 = Monday ... 6 = Saturday
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Monday is 0

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isoStr: string;
      isSelected: boolean;
      isToday: boolean;
      isDisabled: boolean;
    }> = [];

    const todayISO = formatToISO(new Date());
    const currentSelectedISO = value;

    // Days from previous month
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, prevMonthLastDay - i);
      const isoStr = formatToISO(d);
      days.push({
        date: d,
        isCurrentMonth: false,
        isoStr,
        isSelected: isoStr === currentSelectedISO,
        isToday: isoStr === todayISO,
        isDisabled: (minDate && isoStr < minDate) || (maxDate && isoStr > maxDate) || false
      });
    }

    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(viewYear, viewMonth, i);
      const isoStr = formatToISO(d);
      days.push({
        date: d,
        isCurrentMonth: true,
        isoStr,
        isSelected: isoStr === currentSelectedISO,
        isToday: isoStr === todayISO,
        isDisabled: (minDate && isoStr < minDate) || (maxDate && isoStr > maxDate) || false
      });
    }

    // Days of next month to complete 42 cells (6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(viewYear, viewMonth + 1, i);
      const isoStr = formatToISO(d);
      days.push({
        date: d,
        isCurrentMonth: false,
        isoStr,
        isSelected: isoStr === currentSelectedISO,
        isToday: isoStr === todayISO,
        isDisabled: (minDate && isoStr < minDate) || (maxDate && isoStr > maxDate) || false
      });
    }

    return days;
  }, [viewYear, viewMonth, value, minDate, maxDate]);

  // Formatted trigger label
  const formattedTriggerDate = useMemo(() => {
    if (!value) return placeholder;
    const date = parseISODate(value);
    const day = String(date.getDate()).padStart(2, '0');
    const month = MONTH_NAMES_SHORT[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }, [value, placeholder]);

  // Human readable full string for footer
  const fullDateLabel = useMemo(() => {
    if (!value) return '';
    const date = parseISODate(value);
    const dayName = DAY_NAMES_FULL[date.getDay()];
    const day = date.getDate();
    const monthName = MONTH_NAMES_ES[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${day} de ${monthName} de ${year}`;
  }, [value]);

  // Available Years range (from current - 3 to current + 5)
  const availableYears = useMemo(() => {
    const curr = new Date().getFullYear();
    const list = [];
    for (let y = curr - 3; y <= curr + 5; y++) {
      list.push(y);
    }
    return list;
  }, []);

  return (
    <div
      ref={containerRef}
      className={`sena-datepicker-wrapper ${className}`}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', ...style }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`sena-datepicker-trigger sena-datepicker-${size} ${isOpen ? 'active' : ''}`}
        title="Seleccionar fecha"
      >
        <div className="sena-datepicker-icon-wrap">
          <CalendarIcon size={size === 'sm' ? 13 : 15} />
        </div>

        {label && <span className="sena-datepicker-label">{label}</span>}

        <span className="sena-datepicker-val">{formattedTriggerDate}</span>

        <ChevronDown
          size={13}
          className={`sena-datepicker-chevron ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {/* Floating Calendar Dropdown Popup */}
      {isOpen && (
        <div
          className={`sena-datepicker-dropdown ${align === 'right' ? 'align-right' : 'align-left'} animate-popover`}
        >
          {/* Calendar Header */}
          <div className="sena-datepicker-header">
            <div className="sena-datepicker-title-group">
              <button
                type="button"
                className={`sena-datepicker-month-btn ${pickerViewMode === 'months' ? 'active' : ''}`}
                onClick={() =>
                  setPickerViewMode((prev) => (prev === 'months' ? 'days' : 'months'))
                }
              >
                {MONTH_NAMES_ES[viewMonth]}
              </button>

              <button
                type="button"
                className={`sena-datepicker-year-btn ${pickerViewMode === 'years' ? 'active' : ''}`}
                onClick={() =>
                  setPickerViewMode((prev) => (prev === 'years' ? 'days' : 'years'))
                }
              >
                {viewYear}
              </button>
            </div>

            <div className="sena-datepicker-nav-btns">
              <button
                type="button"
                className="sena-datepicker-nav-btn"
                onClick={handlePrevMonth}
                title="Mes anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="sena-datepicker-nav-btn"
                onClick={handleNextMonth}
                title="Mes siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Quick Month Selector View */}
          {pickerViewMode === 'months' && (
            <div className="sena-datepicker-months-grid">
              {MONTH_NAMES_SHORT.map((mName, idx) => (
                <button
                  key={mName}
                  type="button"
                  className={`sena-datepicker-month-cell ${idx === viewMonth ? 'selected' : ''}`}
                  onClick={() => {
                    setViewMonth(idx);
                    setPickerViewMode('days');
                  }}
                >
                  {mName}
                </button>
              ))}
            </div>
          )}

          {/* Quick Year Selector View */}
          {pickerViewMode === 'years' && (
            <div className="sena-datepicker-years-grid">
              {availableYears.map((y) => (
                <button
                  key={y}
                  type="button"
                  className={`sena-datepicker-year-cell ${y === viewYear ? 'selected' : ''}`}
                  onClick={() => {
                    setViewYear(y);
                    setPickerViewMode('days');
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Days Calendar View */}
          {pickerViewMode === 'days' && (
            <>
              {/* Weekday Headers */}
              <div className="sena-datepicker-weekdays-row">
                {WEEKDAY_NAMES_SHORT.map((wd) => (
                  <div key={wd} className="sena-datepicker-weekday-cell">
                    {wd}
                  </div>
                ))}
              </div>

              {/* Day Cells Grid */}
              <div className="sena-datepicker-days-grid">
                {calendarDays.map((dayItem, index) => (
                  <button
                    key={`${dayItem.isoStr}-${index}`}
                    type="button"
                    disabled={dayItem.isDisabled}
                    onClick={() => handleSelectDay(dayItem.date)}
                    className={`sena-datepicker-day-cell ${
                      !dayItem.isCurrentMonth ? 'outside-month' : ''
                    } ${dayItem.isSelected ? 'selected' : ''} ${
                      dayItem.isToday ? 'today' : ''
                    }`}
                    title={dayItem.isoStr}
                  >
                    <span>{dayItem.date.getDate()}</span>
                    {dayItem.isToday && !dayItem.isSelected && (
                      <span className="sena-datepicker-today-dot" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Footer with Human Label & Quick Shortcuts */}
          <div className="sena-datepicker-footer">
            <div className="sena-datepicker-footer-info">
              {fullDateLabel && (
                <span className="sena-datepicker-human-label">{fullDateLabel}</span>
              )}
            </div>

            <div className="sena-datepicker-footer-actions">
              {showTodayShortcut && (
                <button
                  type="button"
                  className="btn btn-secondary sena-datepicker-quick-btn"
                  onClick={handleToday}
                >
                  <Sparkles size={12} color="var(--sena-primary)" />
                  <span>Hoy</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
