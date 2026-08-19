import { useState, useEffect } from 'react';

import { bridge, CONTESTS_API } from './vk-poster/VkPosterTypes';
import type { Contest } from './vk-poster/VkPosterTypes';
import { ContestCard } from './vk-poster/VkPosterEventCard';
import { Modal, ContestDetail } from './vk-poster/VkPosterModal';

export default function VkPosterPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
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

  const bg = isDark ? '#19191a' : '#f5f5f5';
  const cardBg = isDark ? '#2a2a2b' : '#fff';

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: bg, minHeight: '100vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div style={{ background: isDark ? '#1a3a5c' : '#3d6fa0', padding: 'calc(12px + env(safe-area-inset-top)) 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>Календарь конкурсов</h1>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setTab('upcoming')}
            style={{ padding: '8px 18px', borderRadius: '8px 8px 0 0', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', background: tab === 'upcoming' ? '#fff' : 'transparent', color: tab === 'upcoming' ? '#222' : 'rgba(255,255,255,0.8)' }}>
            Актуальные
          </button>
          <button onClick={() => setTab('past')}
            style={{ padding: '8px 18px', borderRadius: '8px 8px 0 0', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', background: tab === 'past' ? '#fff' : 'transparent', color: tab === 'past' ? '#222' : 'rgba(255,255,255,0.8)' }}>
            Прошедшие
          </button>
        </div>
      </div>

      <div style={{ padding: '0', maxWidth: 700, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Загрузка...</div>
        ) : (tab === 'upcoming' ? upcomingContests : pastContests).length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎭</div>
            <div>Конкурсов пока нет</div>
          </div>
        ) : (
          <div>
            {(tab === 'upcoming' ? upcomingContests : pastContests).map(c => (
              <ContestCard key={c.id} contest={c} onClick={() => setSelectedContest(c)} isDark={isDark} cardBg={cardBg} past={tab === 'past'} />
            ))}
          </div>
        )}
      </div>

      {selectedContest && (
        <Modal onClose={() => setSelectedContest(null)} title="">
          <ContestDetail contest={selectedContest} />
        </Modal>
      )}
    </div>
  );
}