import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import type { VKBridge } from '@vkontakte/vk-bridge';

// VK Bridge подключён через <script> в index.html — используем глобальный объект
const bridge = (window as unknown as { vkBridge: VKBridge }).vkBridge;

interface VkUser {
  id: number;
  first_name: string;
  last_name: string;
  photo_100: string;
}

const API_URL = 'https://functions.poehali.dev/be285661-455d-4c13-b45f-897f4395817d';
const UPLOAD_URL = 'https://functions.poehali.dev/cfc99bc2-daff-4110-b9e4-c9699841a7d3';

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  deadline: string | null;
  location: string;
  poster_url: string | null;
  ticket_url: string | null;
  page_url: string | null;
  is_published: boolean;
}

interface EventForm {
  title: string;
  description: string;
  event_date: string;
  deadline: string;
  location: string;
  poster_url: string;
  ticket_url: string;
  page_url: string;
  is_published: boolean;
}

const emptyForm: EventForm = {
  title: '',
  description: '',
  event_date: '',
  deadline: '',
  location: '',
  poster_url: '',
  ticket_url: '',
  page_url: '',
  is_published: true,
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDateShort(iso: string) {
  const d = new Date(iso);
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return { day: d.getDate(), month: months[d.getMonth()], year: d.getFullYear() };
}

function getLaunchParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    groupId: params.get('vk_group_id') || params.get('group_id') || null,
    role: params.get('vk_viewer_group_role') || null,
  };
}

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

    // VKWebAppInit — первый обязательный вызов
    bridge.send('VKWebAppInit');

    if (isAdminByRole) setIsAdmin(true);

    // Данные пользователя
    bridge.send('VKWebAppGetUserInfo').then(data => {
      setVkUser(data as unknown as VkUser);
    }).catch(() => {});

    // Тема — VKWebAppUpdateConfig приходит как событие
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

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#555',
};

function EventCard({ event, isAdmin, onEdit, onDelete, onClick, past, isDark, cardBg }: {
  event: Event; isAdmin: boolean;
  onEdit: (e: Event) => void;
  onDelete: (id: number) => void;
  onClick: () => void;
  past?: boolean;
  isDark?: boolean;
  cardBg?: string;
}) {
  const { day, month, year } = formatDateShort(event.event_date);
  const weekdays = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const d = new Date(event.event_date);
  const weekday = weekdays[d.getDay()];
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!bridge) return;
    const link = event.page_url || event.ticket_url;
    const text = `${event.title}\n🗓 ${day} ${month} ${year}${event.location ? `\n📍 ${event.location}` : ''}`;
    if (link) {
      bridge.send('VKWebAppShare', { link }).catch(() => {
        bridge.send('VKWebAppCopyText', { text }).catch(() => {});
      });
    } else {
      bridge.send('VKWebAppCopyText', { text }).catch(() => {});
    }
  };

  const border = isDark ? '1px solid #333' : '1px solid #e8e8e8';
  const titleColor = isDark ? '#f0f0f0' : '#222';
  const subColor = isDark ? '#aaa' : '#555';

  return (
    <div style={{ background: cardBg || '#fff', borderBottom: border, cursor: 'pointer' }} onClick={onClick}>
      <div style={{ display: 'flex', gap: 12, padding: '14px 16px', alignItems: 'flex-start' }}>
        {/* Poster */}
        <div style={{ flexShrink: 0 }}>
          {event.poster_url ? (
            <img src={event.poster_url} alt={event.title}
              style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', opacity: past ? 0.6 : 1 }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: 12, background: past ? '#e0e0e0' : 'linear-gradient(135deg,#3d6fa0,#5a8fc0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              🎭
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!event.is_published && (
            <span style={{ fontSize: 11, background: '#fff3cd', color: '#856404', padding: '2px 8px', borderRadius: 10, marginBottom: 4, display: 'inline-block', fontWeight: 600 }}>Черновик</span>
          )}
          <div style={{ fontWeight: 600, fontSize: 14, color: titleColor, lineHeight: 1.35, marginBottom: 4 }}>{event.title}</div>
          <div style={{ fontSize: 13, color: '#3d6fa0', fontWeight: 500, marginBottom: 2 }}>
            {day} {month}, {weekday}, {time}
          </div>
          {event.location && (
            <div style={{ fontSize: 12, color: subColor, marginBottom: past ? 0 : 8 }}>{event.location}</div>
          )}
          {!past && (event.ticket_url || event.page_url) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }} onClick={e => e.stopPropagation()}>
              {event.ticket_url && (
                <a href={event.ticket_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: '#3d6fa0', padding: '5px 14px', borderRadius: 20, textDecoration: 'none' }}>
                  Подать заявку
                </a>
              )}
              {event.page_url && (
                <a href={event.page_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, fontWeight: 600, color: '#3d6fa0', background: 'rgba(61,111,160,0.1)', padding: '5px 14px', borderRadius: 20, textDecoration: 'none' }}>
                  Положение
                </a>
              )}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
          <button onClick={handleShare}
            style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${isDark ? '#444' : '#ddd'}`, background: 'none', color: subColor, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ↗
          </button>
          {isAdmin && (
            <>
              <button onClick={() => onEdit(event)}
                style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${isDark ? '#444' : '#ddd'}`, background: 'none', color: '#3d6fa0', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✏️
              </button>
              <button onClick={() => onDelete(event.id)}
                style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${isDark ? '#444' : '#ddd'}`, background: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🗑
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EventDetail({ event, onClose }: { event: Event; onClose: () => void }) {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
        {event.poster_url ? (
          <img src={event.poster_url} alt={event.title}
            style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid #6c3fa0', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg,#6c3fa0,#c44b93)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>🎭</div>
        )}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px', color: '#1a1a1a', lineHeight: 1.3 }}>{event.title}</h2>
          <div style={{ fontSize: 13, color: '#6c3fa0', marginBottom: 4 }}>🗓 {formatDate(event.event_date)}</div>
          {event.location && <div style={{ fontSize: 13, color: '#888' }}>📍 {event.location}</div>}
        </div>
      </div>
      {event.description && (
        <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, marginBottom: 16, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>{event.description}</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {event.ticket_url && (
          <a href={event.ticket_url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', background: 'linear-gradient(135deg,#6c3fa0,#c44b93)', color: '#fff', textAlign: 'center', padding: '13px', borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
            Подать заявку
          </a>
        )}
        {event.page_url && (
          <a href={event.page_url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', background: '#f0eef8', color: '#6c3fa0', textAlign: 'center', padding: '13px', borderRadius: 12, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            Положение
          </a>
        )}
      </div>
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
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