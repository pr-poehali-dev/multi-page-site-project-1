import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/be285661-455d-4c13-b45f-897f4395817d';
const UPLOAD_URL = 'https://functions.poehali.dev/cfc99bc2-daff-4110-b9e4-c9699841a7d3';
const ADMIN_PASSWORD = 'Stron1986';

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
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

export default function VkPosterPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadEvents();
  }, [isAdmin]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const url = isAdmin ? `${API_URL}?published=false` : API_URL;
      const res = await fetch(url);
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить афишу', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setPasswordInput('');
      toast({ title: 'Добро пожаловать', description: 'Режим администратора включён' });
    } else {
      toast({ title: 'Неверный пароль', variant: 'destructive' });
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
      const body = editingEvent ? { id: editingEvent.id, ...form } : form;
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
    if (!confirm('Удалить мероприятие?')) return;
    await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
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

  const upcoming = events.filter(e => new Date(e.event_date) >= new Date());
  const past = events.filter(e => new Date(e.event_date) < new Date());

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #6c3fa0 0%, #c44b93 100%)', padding: '20px 16px 24px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 4 }}>Культурный центр</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Афиша мероприятий</h1>
          </div>
          <button
            onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 20, padding: '6px 14px', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span style={{ fontSize: 16 }}>{isAdmin ? '🔓' : '🔐'}</span>
            {isAdmin ? 'Выйти' : 'Войти'}
          </button>
        </div>

        {isAdmin && (
          <button
            onClick={openCreate}
            style={{ marginTop: 16, background: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', color: '#6c3fa0', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center' }}
          >
            <span style={{ fontSize: 18 }}>+</span> Добавить мероприятие
          </button>
        )}
      </div>

      <div style={{ padding: '12px 4px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Загрузка...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎭</div>
            <div>Мероприятий пока нет</div>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#6c3fa0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                  Предстоящие
                </div>
                {upcoming.map(ev => (
                  <EventCard key={ev.id} event={ev} isAdmin={isAdmin} onEdit={openEdit} onDelete={handleDelete} onClick={() => setSelectedEvent(ev)} />
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 1, margin: '20px 0 12px' }}>
                  Прошедшие
                </div>
                {past.map(ev => (
                  <EventCard key={ev.id} event={ev} isAdmin={isAdmin} onEdit={openEdit} onDelete={handleDelete} onClick={() => setSelectedEvent(ev)} past />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Admin login modal */}
      {showAdminLogin && (
        <Modal onClose={() => setShowAdminLogin(false)} title="Вход для администратора">
          <div style={{ padding: '0 16px 16px' }}>
            <Input
              type="password"
              placeholder="Пароль"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
              style={{ marginBottom: 12 }}
            />
            <Button onClick={handleAdminLogin} className="w-full bg-purple-600 hover:bg-purple-700">
              Войти
            </Button>
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

function EventCard({ event, isAdmin, onEdit, onDelete, onClick, past }: {
  event: Event; isAdmin: boolean;
  onEdit: (e: Event) => void;
  onDelete: (id: number) => void;
  onClick: () => void;
  past?: boolean;
}) {
  const { day, month, year } = formatDateShort(event.event_date);
  return (
    <div
      style={{
        background: past ? '#fff' : 'linear-gradient(135deg, #f8f4ff 0%, #fff0f8 100%)',
        borderRadius: 24,
        marginBottom: 16,
        overflow: 'hidden',
        boxShadow: past ? '0 2px 8px rgba(0,0,0,0.06)' : '0 6px 24px rgba(108,63,160,0.14)',
        border: past ? '1px solid #f0f0f0' : '1px solid rgba(108,63,160,0.12)',
        opacity: past ? 0.65 : 1,
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', padding: '32px 28px 24px' }}>
        {/* Round poster */}
        <div style={{ flexShrink: 0, position: 'relative' }}>
          {event.poster_url ? (
            <img
              src={event.poster_url}
              alt={event.title}
              style={{ width: 200, height: 200, borderRadius: '50%', objectFit: 'cover', border: '5px solid', borderColor: past ? '#ddd' : '#6c3fa0', boxShadow: past ? 'none' : '0 6px 24px rgba(108,63,160,0.35)' }}
            />
          ) : (
            <div style={{ width: 200, height: 200, borderRadius: '50%', background: past ? '#f0f0f0' : 'linear-gradient(135deg,#6c3fa0,#c44b93)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>
              🎭
            </div>
          )}
          {!past && (
            <div style={{ position: 'absolute', bottom: 8, right: 8, width: 24, height: 24, background: '#22c55e', borderRadius: '50%', border: '3px solid #fff' }} />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, paddingTop: 6 }}>
          {!event.is_published && (
            <span style={{ fontSize: 13, background: '#fff3cd', color: '#856404', padding: '4px 10px', borderRadius: 20, marginBottom: 12, display: 'inline-block', fontWeight: 600 }}>Черновик</span>
          )}
          <div style={{ fontWeight: 800, fontSize: 30, color: '#1a1a1a', marginBottom: 18, lineHeight: 1.2 }}>{event.title}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: past ? '#f0f0f0' : 'rgba(108,63,160,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🗓</div>
              <span style={{ fontSize: 20, color: past ? '#aaa' : '#6c3fa0', fontWeight: 700 }}>{day} {month} {year}</span>
            </div>
            {event.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: past ? '#f0f0f0' : 'rgba(196,75,147,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📍</div>
                <span style={{ fontSize: 20, color: '#555', fontWeight: 600 }}>{event.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {!past && (event.ticket_url || event.page_url) && (
        <div style={{ display: 'flex', gap: 12, padding: '0 28px 28px' }} onClick={e => e.stopPropagation()}>
          {event.ticket_url && (
            <a href={event.ticket_url} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, background: 'linear-gradient(135deg,#6c3fa0,#c44b93)', color: '#fff', textAlign: 'center', padding: '18px 8px', borderRadius: 16, fontWeight: 700, fontSize: 20, textDecoration: 'none' }}>
              Подать заявку
            </a>
          )}
          {event.page_url && (
            <a href={event.page_url} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, background: 'rgba(108,63,160,0.08)', color: '#6c3fa0', textAlign: 'center', padding: '18px 8px', borderRadius: 16, fontWeight: 700, fontSize: 20, textDecoration: 'none' }}>
              Положение
            </a>
          )}
        </div>
      )}

      {isAdmin && (
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onEdit(event)} style={{ flex: 1, padding: '14px', border: 'none', background: 'none', color: '#6c3fa0', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            ✏️ Редактировать
          </button>
          <button onClick={() => onDelete(event.id)} style={{ flex: 1, padding: '14px', border: 'none', background: 'none', color: '#e53e3e', fontWeight: 600, fontSize: 14, cursor: 'pointer', borderLeft: '1px solid rgba(0,0,0,0.06)' }}>
            🗑 Удалить
          </button>
        </div>
      )}
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
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
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