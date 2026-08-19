import { bridge, siteUrl, paletteFor } from './VkPosterTypes';
import type { Contest } from './VkPosterTypes';

interface ContestCardProps {
  contest: Contest;
  index: number;
  onClick: () => void;
  past?: boolean;
  isDark?: boolean;
  cardBg?: string;
}

export function ContestCard({ contest, index, onClick, past, isDark, cardBg }: ContestCardProps) {
  const isActive = contest.status === 'active';
  const startDate = new Date(contest.start_date);
  const endDate = new Date(contest.end_date);
  const palette = paletteFor(index);

  const dateStr = contest.event_date
    ? contest.event_date
    : `${startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} — ${endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;

  const isInternal = contest.application_type === 'internal';
  const applyUrl = isInternal ? siteUrl(`/participant-login?contest=${contest.id}`) : contest.application_form_url;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!bridge) return;
    const link = siteUrl(`/contests/${contest.id}`);
    const text = `${contest.title}\n🗓 ${dateStr}${contest.location ? `\n📍 ${contest.location}` : ''}`;
    bridge.send('VKWebAppShare', { link }).catch(() => {
      bridge.send('VKWebAppCopyText', { text }).catch(() => {});
    });
  };

  const titleColor = isDark ? '#f5f5f5' : '#161616';
  const subColor = isDark ? '#9a9a9a' : '#6b6b6b';

  return (
    <div
      onClick={onClick}
      style={{
        background: cardBg || '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: isDark ? '0 4px 18px rgba(0,0,0,0.35)' : '0 4px 18px rgba(30,20,60,0.08)',
        transition: 'transform .15s ease',
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}>
        {contest.poster_url ? (
          <img src={contest.poster_url} alt={contest.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: past ? 'grayscale(0.5) brightness(0.75)' : 'none' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>
            🎭
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.05) 45%, transparent 70%)' }} />

        <span style={{
          position: 'absolute', top: 10, right: 10,
          fontSize: 11, fontWeight: 700, color: '#fff',
          padding: '5px 11px', borderRadius: 20,
          background: past ? 'rgba(90,90,90,0.85)' : isActive ? 'rgba(34,150,90,0.9)' : 'rgba(230,140,0,0.9)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
          {past ? 'Завершён' : isActive ? 'Идёт приём заявок' : 'Скоро'}
        </span>

        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', lineHeight: 1.3, textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
            {contest.title}
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: palette.from, marginBottom: contest.location ? 3 : 8 }}>
          <span>🗓</span><span>{dateStr}</span>
        </div>
        {contest.location && (
          <div style={{ fontSize: 12.5, color: subColor, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>📍</span><span>{contest.location}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!past && applyUrl && (
            <a href={applyUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{
                flex: 1, textAlign: 'center', fontSize: 13.5, fontWeight: 700, color: '#fff',
                background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
                padding: '9px 12px', borderRadius: 12, textDecoration: 'none',
              }}>
              Подать заявку
            </a>
          )}
          <button onClick={handleShare}
            style={{
              width: 38, height: 38, borderRadius: 12, flexShrink: 0,
              border: `1.5px solid ${isDark ? '#3a3a3a' : '#ece9f5'}`,
              background: isDark ? '#232324' : '#faf9fd',
              color: titleColor, cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            ↗
          </button>
        </div>
      </div>
    </div>
  );
}