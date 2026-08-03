import { useEffect, useState } from 'react';
import { DashboardLayout, employeeLinks, internLinks } from '../../layouts/DashboardLayout';
import { GlassCard } from '../../components/UI';
import { calendarApi } from '../../api/client';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const typeColors: Record<string, string> = {
  deadline: 'var(--gold-dark)',
  meeting: 'var(--green)',
  leave: '#dc2626',
  event: 'var(--green-light)',
};

export default function CalendarPage({ role = 'employee' }: { role?: 'employee' | 'intern' }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.toISOString().slice(0, 7));
  const [events, setEvents] = useState<{ date: string; title: string; type: string }[]>([]);
  const links = role === 'intern' ? internLinks : employeeLinks;

  useEffect(() => {
    calendarApi.events(currentMonth).then(setEvents).catch(() => {});
  }, [currentMonth]);

  const [year, month] = currentMonth.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  const monthLabel = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  const eventsForDay = (day: number) => events.filter(e => e.date === `${currentMonth}-${String(day).padStart(2, '0')}`);

  const prevMonth = () => {
    const d = new Date(year, month - 2);
    setCurrentMonth(d.toISOString().slice(0, 7));
  };
  const nextMonth = () => {
    const d = new Date(year, month);
    setCurrentMonth(d.toISOString().slice(0, 7));
  };

  return (
    <DashboardLayout title="Calendar" links={links}>
      <GlassCard style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button className="btn-ghost" onClick={prevMonth}>&larr;</button>
          <h3 style={{ fontFamily: 'var(--font-heading)' }}>{monthLabel}</h3>
          <button className="btn-ghost" onClick={nextMonth}>&rarr;</button>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', fontSize: '0.8rem' }}>
          {Object.entries(typeColors).map(([type, color]) => (
            <span key={type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} /> {type}
            </span>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, textAlign: 'center' }}>
          {days.map(d => <div key={d} style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', padding: 8 }}>{d}</div>)}
          {cells.map((day, i) => {
            const dayEvents = day ? eventsForDay(day) : [];
            const isToday = day === today.getDate() && currentMonth === today.toISOString().slice(0, 7);
            return (
              <div key={i} style={{
                padding: 8, borderRadius: 10, minHeight: 72,
                background: isToday ? 'rgba(46,125,50,0.12)' : 'var(--surface)',
                border: isToday ? '1px solid var(--green)' : '1px solid var(--border)',
                fontSize: '0.8rem',
              }}>
                {day && <>
                  <strong>{day}</strong>
                  {dayEvents.map((e, j) => (
                    <p key={j} style={{ fontSize: '0.6rem', color: typeColors[e.type] || 'var(--text-muted)', marginTop: 2, lineHeight: 1.2 }}>{e.title}</p>
                  ))}
                </>}
              </div>
            );
          })}
        </div>
      </GlassCard>
    </DashboardLayout>
  );
}
