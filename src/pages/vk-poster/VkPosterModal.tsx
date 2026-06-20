import { bridge } from './VkPosterTypes';
import type { Event } from './VkPosterTypes';

export function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxHeight: '90vh', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 12px' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ background: '#f0f0f0', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EventDetail({ event, onClose }: { event: Event; onClose: () => void }) {
  const d = new Date(event.event_date);
  const weekdays = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const shortMonths = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  const weekday = weekdays[d.getDay()];
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const dateShort = `${d.getDate()} ${months[d.getMonth()]}, ${['вс','пн','вт','ср','чт','пт','сб'][d.getDay()]}, ${time}`;

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  let timeLeft = '';
  if (diffDays > 0) {
    if (diffDays >= 30) {
      const m = Math.round(diffDays / 30);
      timeLeft = `через ${m} ${m === 1 ? 'месяц' : m < 5 ? 'месяца' : 'месяцев'}`;
    } else {
      timeLeft = `через ${diffDays} ${diffDays === 1 ? 'день' : diffDays < 5 ? 'дня' : 'дней'}`;
    }
  }

  const handleShare = () => {
    if (!bridge) return;
    const link = event.page_url || event.ticket_url;
    const text = `${event.title}\n🗓 ${dateShort}${event.location ? `\n📍 ${event.location}` : ''}`;
    if (link) {
      bridge.send('VKWebAppShare', { link }).catch(() => {
        bridge.send('VKWebAppCopyText', { text }).catch(() => {});
      });
    } else {
      bridge.send('VKWebAppCopyText', { text }).catch(() => {});
    }
  };

  return (
    <div style={{ padding: '0 16px 20px' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
        {event.poster_url ? (
          <img src={event.poster_url} alt={event.title}
            style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,#3d6fa0,#5a8fc0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>🎭</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111', lineHeight: 1.35, marginBottom: 8 }}>{event.title}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
              <span>🕐</span><span>{dateShort}</span>
            </div>
            {event.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#3d6fa0' }}>
                <span>📍</span><span>{event.location}</span>
              </div>
            )}
            {event.deadline && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#e07b00' }}>
                <span>⏰</span>
                <span>Заявки до: {new Date(event.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {event.ticket_url && (
          <a href={event.ticket_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: '#3d6fa0', padding: '8px 16px', borderRadius: 8, textDecoration: 'none' }}>
            Подать заявку
          </a>
        )}
        {event.page_url && (
          <a href={event.page_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 14, fontWeight: 600, color: '#3d6fa0', background: 'rgba(61,111,160,0.1)', padding: '8px 16px', borderRadius: 8, textDecoration: 'none', border: '1px solid rgba(61,111,160,0.25)' }}>
            Положение
          </a>
        )}
        <button onClick={handleShare}
          style={{ fontSize: 14, fontWeight: 600, color: '#555', background: '#f2f2f2', padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          ↗ Поделиться
        </button>
      </div>

      {event.description && (
        <div style={{ fontSize: 14, color: '#333', marginBottom: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{event.description}</div>
      )}

      <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 10 }}>Расписание</div>
      <div style={{ display: 'inline-block', border: '1px solid #e0e0e0', borderRadius: 12, padding: '16px 24px', textAlign: 'center', minWidth: 120 }}>
        <div style={{ fontSize: 42, fontWeight: 700, color: '#111', lineHeight: 1 }}>{d.getDate()}</div>
        <div style={{ fontSize: 14, color: '#555', marginTop: 2 }}>{shortMonths[d.getMonth()]}</div>
        <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{weekday}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginTop: 4 }}>{time}</div>
        {timeLeft && <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{timeLeft}</div>}
      </div>
    </div>
  );
}
