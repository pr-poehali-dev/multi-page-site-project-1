import { bridge, siteUrl, paletteFor } from './VkPosterTypes';
import type { Contest } from './VkPosterTypes';

export function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void; title?: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,10,30,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxHeight: '92vh', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 4, background: '#e4e0f0' }} />
        </div>
        <button onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.35)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: '#fff', zIndex: 2 }}>×</button>
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
    <div>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`, marginTop: -4 }}>
        {contest.poster_url ? (
          <img src={contest.poster_url} alt={contest.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🎭</div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)' }} />
        <span style={{
          position: 'absolute', top: 12, left: 14,
          fontSize: 11.5, fontWeight: 700, color: '#fff',
          padding: '5px 12px', borderRadius: 20,
          background: isPast ? 'rgba(90,90,90,0.85)' : isActive ? 'rgba(34,150,90,0.9)' : 'rgba(230,140,0,0.9)',
        }}>
          {isPast ? 'Завершён' : isActive ? 'Идёт приём заявок' : 'Скоро'}
        </span>
        <div style={{ position: 'absolute', left: 16, right: 50, bottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#fff', lineHeight: 1.3, textShadow: '0 1px 8px rgba(0,0,0,0.45)' }}>
            {contest.title}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: palette.from }}>
            <span>🗓</span><span>{dateStr}</span>
          </div>
          {contest.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: '#666' }}>
              <span>📍</span><span>{contest.location}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {!isPast && !isFuture && applyUrl && (
            <a href={applyUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 14, fontWeight: 700, color: '#fff', background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`, padding: '10px 18px', borderRadius: 12, textDecoration: 'none' }}>
              Подать заявку
            </a>
          )}
          {contest.pdf_url && (
            <a href={contest.pdf_url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 14, fontWeight: 600, color: '#444', background: '#f4f2fa', padding: '10px 16px', borderRadius: 12, textDecoration: 'none', border: '1px solid #ece9f5' }}>
              📄 Положение
            </a>
          )}
          {contest.blank_form_url && (
            <a href={contest.blank_form_url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 14, fontWeight: 600, color: '#444', background: '#f4f2fa', padding: '10px 16px', borderRadius: 12, textDecoration: 'none', border: '1px solid #ece9f5' }}>
              📝 Бланк заявки
            </a>
          )}
          <button onClick={handleShare}
            style={{ fontSize: 14, fontWeight: 600, color: '#444', background: '#f4f2fa', padding: '10px 14px', borderRadius: 12, border: '1px solid #ece9f5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            ↗ Поделиться
          </button>
        </div>

        {contest.description && (
          <div style={{ fontSize: 14, color: '#333', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{contest.description}</div>
        )}
      </div>
    </div>
  );
}
