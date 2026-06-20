import { bridge } from './VkPosterTypes';
import type { Event } from './VkPosterTypes';

interface EventCardProps {
  event: Event;
  isAdmin: boolean;
  onEdit: (e: Event) => void;
  onDelete: (id: number) => void;
  onClick: () => void;
  past?: boolean;
  isDark?: boolean;
  cardBg?: string;
}

export function EventCard({ event, isAdmin, onEdit, onDelete, onClick, past, isDark, cardBg }: EventCardProps) {
  const weekdays = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const d = new Date(event.event_date);
  const weekday = weekdays[d.getDay()];
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!bridge) return;
    const link = event.page_url || event.ticket_url;
    const text = `${event.title}\n🗓 ${day} ${month} ${year}${event.location ? `\n📍 ${event.location}` : ''}`;
    if (link) {
      bridge.send('VKWebAppShare', { link }).catch(() => {
        bridge.send('VKWebAppCopyText', { text }).catch(() => {});
      });
    } else {
      bridge.send('VKWebAppCopyText', { text }).catch(() => {});
    }
  };

  const border = isDark ? '1px solid #333' : '1px solid #e8e8e8';
  const titleColor = isDark ? '#f0f0f0' : '#222';
  const subColor = isDark ? '#aaa' : '#555';

  return (
    <div style={{ background: cardBg || '#fff', borderBottom: border, cursor: 'pointer' }} onClick={onClick}>
      <div style={{ display: 'flex', gap: 12, padding: '14px 16px', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0 }}>
          {event.poster_url ? (
            <img src={event.poster_url} alt={event.title}
              style={{ width: 173, height: 173, borderRadius: 16, objectFit: 'cover', opacity: past ? 0.6 : 1 }} />
          ) : (
            <div style={{ width: 173, height: 173, borderRadius: 16, background: past ? '#e0e0e0' : 'linear-gradient(135deg,#3d6fa0,#5a8fc0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
              🎭
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {!event.is_published && (
            <span style={{ fontSize: 11, background: '#fff3cd', color: '#856404', padding: '2px 8px', borderRadius: 10, marginBottom: 4, display: 'inline-block', fontWeight: 600 }}>Черновик</span>
          )}
          <div style={{ fontWeight: 600, fontSize: 14, color: titleColor, lineHeight: 1.35, marginBottom: 4 }}>{event.title}</div>
          <div style={{ fontSize: 13, color: '#3d6fa0', fontWeight: 500, marginBottom: 2 }}>
            {dateStr}, {weekday}, {time}
          </div>
          {event.location && (
            <div style={{ fontSize: 12, color: subColor, marginBottom: 2 }}>{event.location}</div>
          )}
          {!past && event.deadline && (
            <div style={{ fontSize: 12, color: '#e07b00', fontWeight: 500, marginBottom: 2 }}>
              Заявки до: {new Date(event.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </div>
          )}
          {!past && (event.ticket_url || event.page_url) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }} onClick={e => e.stopPropagation()}>
              {event.ticket_url && (
                <a href={event.ticket_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: '#3d6fa0', padding: '5px 14px', borderRadius: 20, textDecoration: 'none' }}>
                  Подать заявку
                </a>
              )}
              {event.page_url && (
                <a href={event.page_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, fontWeight: 600, color: '#3d6fa0', background: 'rgba(61,111,160,0.1)', padding: '5px 14px', borderRadius: 20, textDecoration: 'none' }}>
                  Положение
                </a>
              )}
            </div>
          )}
        </div>

        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
          <button onClick={handleShare}
            style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${isDark ? '#444' : '#ddd'}`, background: 'none', color: subColor, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ↗
          </button>
          {isAdmin && (
            <>
              <button onClick={() => onEdit(event)}
                style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${isDark ? '#444' : '#ddd'}`, background: 'none', color: '#3d6fa0', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✏️
              </button>
              <button onClick={() => onDelete(event.id)}
                style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${isDark ? '#444' : '#ddd'}`, background: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🗑
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
