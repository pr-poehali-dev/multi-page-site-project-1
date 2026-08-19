import { bridge, siteUrl, paletteFor } from './VkPosterTypes';
import type { Contest } from './VkPosterTypes';

interface ContestCardProps {
  contest: Contest;
  index?: number;
  onClick: () => void;
  past?: boolean;
  isDark?: boolean;
  cardBg?: string;
}

export function ContestCard({ contest, index = 0, onClick, past, isDark, cardBg }: ContestCardProps) {
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

  const titleColor = isDark ? '#f2f2f3' : '#18181b';
  const subColor = isDark ? '#9c9ca3' : '#6b6b74';

  return (
    <div
      onClick={onClick}
      style={{
        background: cardBg || '#fff',
        margin: '12px 14px',
        borderRadius: 22,
        cursor: 'pointer',
        boxShadow: isDark ? '0 2px 14px rgba(0,0,0,0.35)' : '0 2px 14px rgba(30,20,70,0.07)',
        border: isDark ? '1px solid #303032' : '1px solid #efeef4',
      }}
    >
      <div style={{ display: 'flex', gap: 14, padding: 14, alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0, position: 'relative' }}>
          {contest.poster_url ? (
            <img src={contest.poster_url} alt={contest.title}
              style={{ width: 192, height: 192, borderRadius: 17, objectFit: 'cover', filter: past ? 'grayscale(0.55) brightness(0.8)' : 'none' }} />
          ) : (
            <div style={{ width: 192, height: 192, borderRadius: 17, background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>
              🎭
            </div>
          )}
          {!past && (
            <span style={{
              position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)',
              fontSize: 11.5, fontWeight: 700, color: '#fff', padding: '4px 10px', borderRadius: 20,
              background: isActive ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#f59e0b,#ea580c)',
              whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            }}>
              {isActive ? 'Приём заявок' : 'Скоро'}
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: titleColor, lineHeight: 1.28, marginBottom: 6 }}>{contest.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: palette.from, fontWeight: 600, marginBottom: 4 }}>
            <span>🗓</span><span>{dateStr}</span>
          </div>
          {contest.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: subColor, marginBottom: 4 }}>
              <span>📍</span><span>{contest.location}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9 }}>
            {!past && applyUrl && (
              <a href={applyUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                style={{
                  fontSize: 13, fontWeight: 700, color: '#fff',
                  background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
                  padding: '6px 15px', borderRadius: 20, textDecoration: 'none',
                }}>
                Подать заявку
              </a>
            )}
            {contest.pdf_url && (
              <a href={contest.pdf_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                style={{
                  fontSize: 13, fontWeight: 700, color: titleColor,
                  background: isDark ? '#2c2c2e' : '#f5f3fa',
                  padding: '6px 15px', borderRadius: 20, textDecoration: 'none',
                }}>
                📄 Положение
              </a>
            )}
          </div>
        </div>

        <button onClick={handleShare}
          style={{
            width: 36, height: 36, borderRadius: 12, flexShrink: 0,
            border: 'none', background: isDark ? '#2c2c2e' : '#f5f3fa',
            color: subColor, cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          ↗
        </button>
      </div>
    </div>
  );
}