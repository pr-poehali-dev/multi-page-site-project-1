import { bridge, siteUrl } from './VkPosterTypes';
import type { Contest } from './VkPosterTypes';

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

export function ContestDetail({ contest }: { contest: Contest }) {
  const startDate = new Date(contest.start_date);
  const endDate = new Date(contest.end_date);
  const now = new Date();
  const isActive = contest.status === 'active';
  const isPast = endDate < now;
  const isFuture = startDate > now;
  const isInternal = contest.application_type === 'internal';
  const applyUrl = isInternal ? siteUrl(`/participant-login?contest=${contest.id}`) : contest.application_form_url;

  const dateStr = contest.event_date
    ? contest.event_date
    : `${startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} — ${endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const handleShare = () => {
    if (!bridge) return;
    const link = siteUrl(`/contests/${contest.id}`);
    const text = `${contest.title}\n🗓 ${dateStr}${contest.location ? `\n📍 ${contest.location}` : ''}`;
    bridge.send('VKWebAppShare', { link }).catch(() => {
      bridge.send('VKWebAppCopyText', { text }).catch(() => {});
    });
  };

  return (
    <div style={{ padding: '0 16px 20px' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
        {contest.poster_url ? (
          <img src={contest.poster_url} alt={contest.title}
            style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,#3d6fa0,#5a8fc0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>🎭</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111', lineHeight: 1.35, marginBottom: 8 }}>{contest.title}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
              <span>🕐</span><span>{dateStr}</span>
            </div>
            {contest.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#3d6fa0' }}>
                <span>📍</span><span>{contest.location}</span>
              </div>
            )}
            <span style={{ fontSize: 12, fontWeight: 600, color: isPast ? '#999' : isActive ? '#2e9e5b' : '#e07b00' }}>
              {isPast ? 'Завершён' : isActive ? 'Идёт приём заявок' : 'Скоро'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {!isPast && !isFuture && applyUrl && (
          <a href={applyUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: '#3d6fa0', padding: '8px 16px', borderRadius: 8, textDecoration: 'none' }}>
            Подать заявку
          </a>
        )}
        {contest.pdf_url && (
          <a href={contest.pdf_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 14, fontWeight: 600, color: '#3d6fa0', background: 'rgba(61,111,160,0.1)', padding: '8px 16px', borderRadius: 8, textDecoration: 'none', border: '1px solid rgba(61,111,160,0.25)' }}>
            Скачать положение
          </a>
        )}
        {contest.blank_form_url && (
          <a href={contest.blank_form_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 14, fontWeight: 600, color: '#3d6fa0', background: 'rgba(61,111,160,0.1)', padding: '8px 16px', borderRadius: 8, textDecoration: 'none', border: '1px solid rgba(61,111,160,0.25)' }}>
            Скачать бланк заявки
          </a>
        )}
        <button onClick={handleShare}
          style={{ fontSize: 14, fontWeight: 600, color: '#555', background: '#f2f2f2', padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          ↗ Поделиться
        </button>
      </div>

      {contest.description && (
        <div style={{ fontSize: 14, color: '#333', marginBottom: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{contest.description}</div>
      )}
    </div>
  );
}