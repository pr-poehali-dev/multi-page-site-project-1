import { bridge, siteUrl, paletteFor } from './VkPosterTypes';
import type { Contest } from './VkPosterTypes';

export function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void; title?: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,8,26,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '22px 22px 0 0', width: '100%', maxHeight: '92vh', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom)', position: 'relative' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 4, background: '#e6e3f0' }} />
        </div>
        <button onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.35)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 15, color: '#fff', zIndex: 2 }}>×</button>
        {children}
      </div>
    </div>
  );
}

export function ContestDetail({ contest, index = 0 }: { contest: Contest; index?: number }) {
  const startDate = new Date(contest.start_date);
  const endDate = new Date(contest.end_date);
  const now = new Date();
  const isActive = contest.status === 'active';
  const isPast = endDate < now;
  const isFuture = startDate > now;
  const isInternal = contest.application_type === 'internal';
  const applyUrl = isInternal ? siteUrl(`/participant-login?contest=${contest.id}`) : contest.application_form_url;
  const palette = paletteFor(index);

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
    <div style={{ padding: '18px 16px 22px' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
        {contest.poster_url ? (
          <img src={contest.poster_url} alt={contest.title}
            style={{ width: 84, height: 84, borderRadius: 18, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 84, height: 84, borderRadius: 18, background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>🎭</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15.5, color: '#161618', lineHeight: 1.3, marginBottom: 8 }}>{contest.title}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: palette.from }}>
              <span>🗓</span><span>{dateStr}</span>
            </div>
            {contest.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#666' }}>
                <span>📍</span><span>{contest.location}</span>
              </div>
            )}
            <span style={{
              display: 'inline-flex', alignSelf: 'flex-start', fontSize: 11, fontWeight: 700, color: '#fff',
              padding: '3px 10px', borderRadius: 20, marginTop: 2,
              background: isPast ? '#9a9aa3' : isActive ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#f59e0b,#ea580c)',
            }}>
              {isPast ? 'Завершён' : isActive ? 'Идёт приём заявок' : 'Скоро'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {!isPast && !isFuture && applyUrl && (
          <a href={applyUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 14, fontWeight: 700, color: '#fff', background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`, padding: '10px 18px', borderRadius: 14, textDecoration: 'none' }}>
            Подать заявку
          </a>
        )}
        {contest.pdf_url && (
          <a href={contest.pdf_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 14, fontWeight: 600, color: '#3f3f46', background: '#f5f3fa', padding: '10px 16px', borderRadius: 14, textDecoration: 'none' }}>
            📄 Положение
          </a>
        )}
        {contest.blank_form_url && (
          <a href={contest.blank_form_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 14, fontWeight: 600, color: '#3f3f46', background: '#f5f3fa', padding: '10px 16px', borderRadius: 14, textDecoration: 'none' }}>
            📝 Бланк заявки
          </a>
        )}
        <button onClick={handleShare}
          style={{ fontSize: 14, fontWeight: 600, color: '#3f3f46', background: '#f5f3fa', padding: '10px 14px', borderRadius: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          ↗ Поделиться
        </button>
      </div>

      {contest.description && (
        <div style={{ fontSize: 14, color: '#333', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{contest.description}</div>
      )}
    </div>
  );
}
