import { useState, useEffect } from 'react';

import { bridge, CONTESTS_API } from './vk-poster/VkPosterTypes';
import type { Contest } from './vk-poster/VkPosterTypes';
import { ContestCard } from './vk-poster/VkPosterEventCard';
import { Modal, ContestDetail } from './vk-poster/VkPosterModal';

export default function VkPosterPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (!bridge) return;

    bridge.send('VKWebAppInit');

    const unsubscribe = bridge.subscribe((e) => {
      if (e.detail.type === 'VKWebAppUpdateConfig') {
        const scheme = (e.detail.data as Record<string, unknown>).scheme as string | undefined;
        setIsDark(scheme === 'space_gray' || scheme === 'vkcom_dark');
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadContests();
  }, []);

  const loadContests = async () => {
    setLoading(true);
    try {
      const res = await fetch(CONTESTS_API);
      const data = await res.json();
      setContests(data.contests || []);
    } catch {
      setContests([]);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const upcomingContests = contests.filter(c => new Date(c.end_date) >= now);
  const pastContests = contests.filter(c => new Date(c.end_date) < now);
  const list = tab === 'upcoming' ? upcomingContests : pastContests;

  const bg = isDark ? '#131314' : '#f6f4fb';
  const cardBg = isDark ? '#212123' : '#fff';

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: bg, minHeight: '100vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 45%, #ec4899 100%)',
        padding: 'calc(20px + env(safe-area-inset-top)) 18px 18px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -20, fontSize: 110, opacity: 0.15, lineHeight: 1 }}>🎭</div>
        <div style={{ position: 'relative' }}>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>Календарь конкурсов</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13.5, margin: '4px 0 16px', fontWeight: 500 }}>Вокал · хореография · театр · музыка</p>

          <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.16)', padding: 4, borderRadius: 14, backdropFilter: 'blur(6px)' }}>
            <button onClick={() => setTab('upcoming')}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 11, border: 'none', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
                background: tab === 'upcoming' ? '#fff' : 'transparent',
                color: tab === 'upcoming' ? '#7c3aed' : 'rgba(255,255,255,0.9)',
                transition: 'all .2s',
              }}>
              Актуальные{upcomingContests.length > 0 ? ` · ${upcomingContests.length}` : ''}
            </button>
            <button onClick={() => setTab('past')}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 11, border: 'none', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
                background: tab === 'past' ? '#fff' : 'transparent',
                color: tab === 'past' ? '#7c3aed' : 'rgba(255,255,255,0.9)',
                transition: 'all .2s',
              }}>
              Прошедшие{pastContests.length > 0 ? ` · ${pastContests.length}` : ''}
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 14px', maxWidth: 700, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Загрузка...</div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎭</div>
            <div>Конкурсов пока нет</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {list.map((c, i) => (
              <ContestCard key={c.id} contest={c} index={i} onClick={() => setSelectedIndex(i)} isDark={isDark} cardBg={cardBg} past={tab === 'past'} />
            ))}
          </div>
        )}
      </div>

      {selectedIndex !== null && list[selectedIndex] && (
        <Modal onClose={() => setSelectedIndex(null)}>
          <ContestDetail contest={list[selectedIndex]} index={selectedIndex} />
        </Modal>
      )}
    </div>
  );
}
