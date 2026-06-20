import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

import {
  bridge, API_URL, UPLOAD_URL,
  emptyForm, getLaunchParams, labelStyle,
} from './vk-poster/VkPosterTypes';
import type { Event, EventForm, VkUser } from './vk-poster/VkPosterTypes';
import { EventCard } from './vk-poster/VkPosterEventCard';
import { Modal, EventDetail } from './vk-poster/VkPosterModal';

export default function VkPosterPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [vkUser, setVkUser] = useState<VkUser | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [groupId, setGroupId] = useState<string | null>(() => getLaunchParams().groupId);
  const [isAdminByRole] = useState<boolean>(() => {
    const role = getLaunchParams().role;
    return role === 'admin' || role === 'editor';
  });
  const posterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!bridge) return;

    bridge.send('VKWebAppInit');

    if (isAdminByRole) setIsAdmin(true);

    bridge.send('VKWebAppGetUserInfo').then(data => {
      setVkUser(data as unknown as VkUser);
    }).catch(() => {});

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
    loadEvents();
  }, [isAdmin, groupId]);

  const loadEvents = async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const published = isAdmin ? 'false' : 'true';
      const url = `${API_URL}?group_id=${groupId}&published=${published}`;
      const res = await fetch(url);
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить афишу', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingEvent(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (e: Event) => {
    setEditingEvent(e);
    setForm({
      title: e.title,
      description: e.description || '',
      event_date: e.event_date ? e.event_date.slice(0, 16) : '',
      deadline: e.deadline ? e.deadline.slice(0, 16) : '',
      location: e.location || '',
      poster_url: e.poster_url || '',
      ticket_url: e.ticket_url || '',
      page_url: e.page_url || '',
      is_published: e.is_published,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Укажите название', variant: 'destructive' });
      return;
    }
    if (!form.event_date) {
      toast({ title: 'Укажите дату', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const method = editingEvent ? 'PUT' : 'POST';
      const body = editingEvent ? { id: editingEvent.id, ...form, group_id: groupId } : { ...form, group_id: groupId };
      const res = await fetch(API_URL, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowModal(false);
        loadEvents();
        toast({ title: editingEvent ? 'Мероприятие обновлено' : 'Мероприятие добавлено' });
      }
    } catch {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    await fetch(`${API_URL}?id=${confirmDeleteId}&group_id=${groupId}`, { method: 'DELETE' });
    setConfirmDeleteId(null);
    loadEvents();
    toast({ title: 'Удалено' });
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPoster(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1];
        const res = await fetch(UPLOAD_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId: 0,
            files: [{ fileName: `event_poster_${file.name}`, fileType: file.type, fileSize: file.size, fileData: base64 }],
          }),
        });
        const data = await res.json();
        if (data.files?.[0]?.fileUrl) {
          setForm(f => ({ ...f, poster_url: data.files[0].fileUrl }));
          toast({ title: 'Постер загружен' });
        }
        setUploadingPoster(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' });
      setUploadingPoster(false);
    }
  };

  const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date());
  const pastEvents = events.filter(e => new Date(e.event_date) < new Date());
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const bg = isDark ? '#19191a' : '#f5f5f5';
  const cardBg = isDark ? '#2a2a2b' : '#fff';

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: bg, minHeight: '100vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header */}
      <div style={{ background: isDark ? '#1a3a5c' : '#3d6fa0', padding: 'calc(12px + env(safe-area-inset-top)) 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>Афиша</h1>
          {isAdmin && (
            <button onClick={openCreate}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 14px', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              + Добавить
            </button>
          )}
        </div>
        {/* Tabs */}
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
        {!groupId ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <div>Приложение должно быть открыто из сообщества ВКонтакте</div>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Загрузка...</div>
        ) : (tab === 'upcoming' ? upcomingEvents : pastEvents).length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎭</div>
            <div>Мероприятий пока нет</div>
          </div>
        ) : (
          <div>
            {(tab === 'upcoming' ? upcomingEvents : pastEvents).map(ev => (
              <EventCard key={ev.id} event={ev} isAdmin={isAdmin} onEdit={openEdit} onDelete={handleDelete} onClick={() => setSelectedEvent(ev)} isDark={isDark} cardBg={cardBg} past={tab === 'past'} />
            ))}
          </div>
        )}
      </div>

      {/* Confirm delete dialog */}
      {confirmDeleteId !== null && (
        <Modal onClose={() => setConfirmDeleteId(null)} title="Удалить мероприятие?">
          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#555' }}>Это действие нельзя отменить.</p>
            <Button onClick={confirmDelete} className="w-full" style={{ background: '#e53e3e', color: '#fff' }}>Удалить</Button>
            <Button onClick={() => setConfirmDeleteId(null)} variant="outline" className="w-full">Отмена</Button>
          </div>
        </Modal>
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <Modal onClose={() => setSelectedEvent(null)} title="">
          <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        </Modal>
      )}

      {/* Create/Edit modal */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)} title={editingEvent ? 'Редактировать' : 'Новое мероприятие'}>
          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>Название *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Название мероприятия" />
            </div>
            <div>
              <label style={labelStyle}>Описание</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Описание" rows={3} />
            </div>
            <div>
              <label style={labelStyle}>Дата и время *</label>
              <Input type="datetime-local" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Подача заявок до</label>
              <Input type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Место проведения</label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Адрес или площадка" />
            </div>
            <div>
              <label style={labelStyle}>Постер</label>
              <input ref={posterInputRef} type="file" accept="image/*" onChange={handlePosterUpload} className="hidden" />
              <Button type="button" variant="outline" onClick={() => posterInputRef.current?.click()} disabled={uploadingPoster} className="w-full">
                <Icon name="Upload" size={16} className="mr-2" />
                {uploadingPoster ? 'Загрузка...' : form.poster_url ? 'Заменить постер' : 'Загрузить постер'}
              </Button>
              {form.poster_url && (
                <img src={form.poster_url} alt="Постер" style={{ marginTop: 8, width: '100%', height: 140, objectFit: 'cover', borderRadius: 8 }} />
              )}
            </div>
            <div>
              <label style={labelStyle}>Ссылка на билеты</label>
              <Input value={form.ticket_url} onChange={e => setForm(f => ({ ...f, ticket_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label style={labelStyle}>Ссылка на страницу мероприятия</label>
              <Input value={form.page_url} onChange={e => setForm(f => ({ ...f, page_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="pub" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
              <label htmlFor="pub" style={{ fontSize: 14, cursor: 'pointer' }}>Опубликовано</label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
              {saving ? 'Сохранение...' : editingEvent ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
