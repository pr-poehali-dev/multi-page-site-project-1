import { bridge, siteUrl } from './VkPosterTypes';
import type { Contest } from './VkPosterTypes';

interface ContestCardProps {
  contest: Contest;
  index?: number;
  onClick: () => void;
  past?: boolean;
  isDark?: boolean;
  cardBg?: string;
}

export function ContestCard({ contest, onClick, past, isDark, cardBg }: ContestCardProps) {
  const isActive = contest.status === 'active';
  const startDate = new Date(contest.start_date);
  const endDate = new Date(contest.end_date);

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

  const border = isDark ? '1px solid #333' : '1px solid #e8e8e8';
  const titleColor = isDark ? '#f0f0f0' : '#222';
  const subColor = isDark ? '#aaa' : '#555';

  return (
    <div style={{ background: cardBg || '#fff', borderBottom: border, cursor: 'pointer' }} onClick={onClick}>
      <div style={{ display: 'flex', gap: 12, padding: '14px 16px', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0 }}>
          {contest.poster_url ? (
            <img src={contest.poster_url} alt={contest.title}
              style={{ width: 100, height: 100, borderRadius: 16, objectFit: 'cover', opacity: past ? 0.6 : 1 }} />
          ) : (
            <div style={{ width: 100, height: 100, borderRadius: 16, background: past ? '#e0e0e0' : 'linear-gradient(135deg,#3d6fa0,#5a8fc0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
              🎭
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: titleColor, lineHeight: 1.35, marginBottom: 4 }}>{contest.title}</div>
          <div style={{ fontSize: 13, color: '#3d6fa0', fontWeight: 500, marginBottom: 2 }}>
            {dateStr}
          </div>
          {contest.location && (
            <div style={{ fontSize: 12, color: subColor, marginBottom: 2 }}>{contest.location}</div>
          )}
          {!past && (
            <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? '#2e9e5b' : '#e07b00' }}>
              {isActive ? '● Идёт приём заявок' : '● Скоро'}
            </span>
          )}
          {!past && (applyUrl || contest.pdf_url || contest.blank_form_url) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }} onClick={e => e.stopPropagation()}>
              {applyUrl && (
                <a href={applyUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: '#3d6fa0', padding: '5px 14px', borderRadius: 20, textDecoration: 'none' }}>
                  Подать заявку
                </a>
              )}
            </div>
          )}
        </div>

        <div style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button onClick={handleShare}
            style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${isDark ? '#444' : '#ddd'}`, background: 'none', color: subColor, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ↗
          </button>
        </div>
      </div>
    </div>
  );
}
