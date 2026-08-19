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
  const list = contests.filter(c => new Date(c.end_date) >= now);

  const bg = isDark ? '#141415' : '#f6f5fa';
  const cardBg = isDark ? '#232325' : '#fff';

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: bg, minHeight: '100vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div style={{
        background: 'linear-gradient(120deg, #6d28d9 0%, #9333ea 50%, #db2777 100%)',
        padding: 'calc(18px + env(safe-area-inset-top)) 18px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -34, right: -14, fontSize: 100, opacity: 0.14, lineHeight: 1, transform: 'rotate(-8deg)' }}>🎭</div>
        <div style={{ position: 'relative' }}>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>Календарь конкурсов</h1>
          <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 12.5, margin: '3px 0 0', fontWeight: 500 }}>Вокал · хореография · театр · музыка</p>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', width: '100%', boxSizing: 'border-box', paddingTop: 4 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 50, color: '#999' }}>Загрузка...</div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50, color: '#999' }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🎭</div>
            <div>Конкурсов пока нет</div>
          </div>
        ) : (
          <div>
            {list.map((c, i) => (
              <ContestCard key={c.id} contest={c} index={i} onClick={() => setSelectedIndex(i)} isDark={isDark} cardBg={cardBg} />
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