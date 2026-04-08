import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import type { UITechnicalStaffTicket } from '../../services/ticketMapper';

interface CalendarProps {
  tickets: UITechnicalStaffTicket[];
}

export function Calendar({ tickets }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get all days for current month and calendar grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Create array for calendar grid
  const calendarDays = useMemo(() => {
    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [year, month, daysInMonth, startingDayOfWeek]);

  const hasStartedWork = (ticket: UITechnicalStaffTicket): boolean => {
    const uiStatus = String(ticket.status || '').trim().toLowerCase();
    const jobStatus = String(ticket.job_status || '').trim().toLowerCase();

    // Exclude finished tickets from SLA deadline tracking calendar.
    if (uiStatus === 'closed' || jobStatus === 'completed') return false;

    // Mirror tracker behavior: Start Work is active once time_in exists or ticket moved in lifecycle.
    if (Boolean(ticket.time_in)) return true;
    if (['in progress', 'resolved', 'closed'].includes(uiStatus)) return true;
    if (['start work', 'in progress', 'started'].includes(jobStatus)) return true;
    return false;
  };

  const getSlaDeadline = (ticket: UITechnicalStaffTicket): Date | null => {
    if (!ticket.time_in || !ticket.total || ticket.total <= 0) return null;
    const startedAt = new Date(ticket.time_in);
    if (Number.isNaN(startedAt.getTime())) return null;
    return new Date(startedAt.getTime() + ticket.total * 60 * 60 * 1000);
  };

  // Group tickets by their SLA deadline date.
  const ticketsByDate = useMemo(() => {
    const map = new Map<string, UITechnicalStaffTicket[]>();

    const startWorkTickets = tickets.filter((ticket) => hasStartedWork(ticket) && Boolean(getSlaDeadline(ticket)));

    startWorkTickets.forEach((ticket) => {
      const deadline = getSlaDeadline(ticket);
      if (!deadline) return;
      const dateKey = `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, '0')}-${String(deadline.getDate()).padStart(2, '0')}`;

      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)?.push(ticket);
    });

    return map;
  }, [tickets]);

  const getDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const formatDateKey = (dateKey: string): string => {
    const d = new Date(`${dateKey}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dateKey;
    return d.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getSLAStatusColor = (slaHours: number, totalHours: number): string => {
    if (!totalHours || totalHours <= 0) return 'text-gray-300';
    const pct = (slaHours / totalHours) * 100;
    if (pct <= 25) return 'text-red-400';
    if (pct <= 50) return 'text-yellow-300';
    return 'text-green-300';
  };

  const selectedTickets = selectedDateKey ? ticketsByDate.get(selectedDateKey) || [] : [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {monthNames[month]} {year}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {ticketsByDate.size} date(s) with SLA deadlines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-xs font-medium text-[#0E8F79] dark:text-green-400 hover:bg-green-50 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 relative">
        {calendarDays.map((date, index) => {
          const dateKey = date ? getDateKey(date) : null;
          const dayTickets = dateKey ? ticketsByDate.get(dateKey) : [];
          const hasTickets = dayTickets && dayTickets.length > 0;
          const today = isToday(date);

          return (
            <div
              key={index}
              role={hasTickets ? 'button' : undefined}
              tabIndex={hasTickets ? 0 : undefined}
              onClick={() => {
                if (dateKey && hasTickets) setSelectedDateKey(dateKey);
              }}
              onKeyDown={(e) => {
                if (!dateKey || !hasTickets) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedDateKey(dateKey);
                }
              }}
              className={`
                aspect-square rounded-lg border transition-all
                ${date === null ? 'bg-transparent border-transparent' : ''}
                ${date && !today ? 'bg-gray-50 dark:bg-gray-700 border-gray-100 dark:border-gray-600' : ''}
                ${today ? 'bg-[#3BC25B] border-[#3BC25B]' : ''}
                ${hasTickets && !today ? 'border-[#0E8F79] dark:border-green-400 bg-green-50 dark:bg-gray-700' : ''}
                ${hasTickets && !today ? 'hover:shadow-md cursor-pointer' : ''}
                ${hasTickets ? 'focus:outline-none focus:ring-2 focus:ring-[#0E8F79] focus:ring-offset-1' : ''}
                flex flex-col items-center justify-center text-xs p-1 relative
              `}
            >
              {date && (
                <>
                  <span
                    className={`
                      font-semibold
                      ${today ? 'text-white' : ''}
                      ${!today && hasTickets ? 'text-[#0E8F79] dark:text-green-400' : ''}
                      ${!today && !hasTickets ? 'text-gray-900 dark:text-gray-300' : ''}
                    `}
                  >
                    {date.getDate()}
                  </span>
                  {hasTickets && (
                    <div className="flex flex-col items-center gap-0.5 mt-1 w-full">
                      <span
                        className={`
                          text-xs font-bold px-1.5 py-0.5 rounded
                          ${today ? 'bg-white/20 text-white' : 'bg-[#0E8F79] text-white dark:bg-green-500'}
                        `}
                      >
                        {dayTickets.length}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#0E8F79] dark:bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Has ticket SLA deadline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#3BC25B]"></div>
            <span className="text-gray-600 dark:text-gray-400">Today</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          Click a date to view SLA details and deadline-tracked tickets
        </p>
      </div>

      {selectedDateKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedDateKey(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                  SLA Deadlines
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDateKey(selectedDateKey)} • {selectedTickets.length} ticket(s)
                </p>
              </div>
              <button
                onClick={() => setSelectedDateKey(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close SLA details modal"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="p-4 max-h-[65vh] overflow-y-auto space-y-2">
              {selectedTickets.map((ticket) => {
                const slaPercent = ticket.total > 0 ? (ticket.sla / ticket.total) * 100 : 0;
                const isUrgent = slaPercent <= 25;
                const isWarning = slaPercent <= 50 && slaPercent > 25;
                const deadline = getSlaDeadline(ticket);

                return (
                  <div
                    key={ticket.id}
                    className={`text-xs p-3 rounded border ${
                      isUrgent
                        ? 'border-red-200 dark:border-red-800 bg-red-50/70 dark:bg-red-900/10'
                        : isWarning
                        ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/70 dark:bg-yellow-900/10'
                        : 'border-green-200 dark:border-green-800 bg-green-50/70 dark:bg-green-900/10'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-gray-100">#{ticket.id}</div>
                    <div className="text-gray-700 dark:text-gray-300 break-words">{ticket.issue}</div>
                    <div className="text-gray-500 dark:text-gray-400 mt-1">Client: {ticket.client}</div>
                    <div className={`text-xs font-bold mt-2 ${getSLAStatusColor(ticket.sla, ticket.total)}`}>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {deadline
                            ? `Deadline: ${deadline.toLocaleDateString()} ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : 'Deadline not available'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {selectedTickets.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No tickets found for this date.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
