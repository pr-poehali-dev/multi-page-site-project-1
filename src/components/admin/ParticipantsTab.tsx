import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API = 'https://functions.poehali.dev/52234468-777f-4edf-ba7a-985257092904';

interface Participant {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  created_at: string;
  applications_count: number;
  unread_count: number;
}

interface ChatMessage {
  id: number;
  participant_id: number;
  sender: 'admin' | 'user';
  message: string;
  created_at: string;
  is_read: boolean;
}

const ParticipantsTab = () => {
  const { toast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [chatParticipant, setChatParticipant] = useState<Participant | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadParticipants = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}?action=list`);
      const data = await res.json();
      setParticipants(data.participants || []);
    } catch { setParticipants([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadParticipants(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openChat = async (p: Participant) => {
    setChatParticipant(p);
    setMessagesLoading(true);
    try {
      const res = await fetch(`${API}?action=chat&participant_id=${p.id}`);
      const data = await res.json();
      setMessages(data.messages || []);
      // Помечаем прочитанными
      await fetch(`${API}?action=read&participant_id=${p.id}`, { method: 'PUT' });
      setParticipants(ps => ps.map(x => x.id === p.id ? { ...x, unread_count: 0 } : x));
    } catch { setMessages([]); }
    finally { setMessagesLoading(false); }
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !chatParticipant) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`${API}?action=send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant_id: chatParticipant.id, message: msgText.trim(), sender: 'admin' }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages(ms => [...ms, data.message]);
        setMsgText('');
      }
    } catch { toast({ title: 'Ошибка отправки', variant: 'destructive' }); }
    finally { setSendingMsg(false); }
  };

  const deleteParticipant = async (p: Participant) => {
    if (!confirm(`Удалить аккаунт «${p.full_name}»? Данные будут обнулены.`)) return;
    try {
      await fetch(`${API}?action=delete&id=${p.id}`, { method: 'PUT' });
      setParticipants(ps => ps.filter(x => x.id !== p.id));
      if (chatParticipant?.id === p.id) setChatParticipant(null);
      toast({ title: 'Аккаунт удалён' });
    } catch { toast({ title: 'Ошибка удаления', variant: 'destructive' }); }
  };

  const filtered = participants.filter(p =>
    !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.city?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = participants.reduce((s, p) => s + (p.unread_count || 0), 0);

  // ── Чат открыт ──
  if (chatParticipant) return (
    <div className="flex flex-col h-[70vh]">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b">
        <Button variant="outline" size="sm" onClick={() => setChatParticipant(null)}>
          <Icon name="ArrowLeft" size={16} className="mr-1" /> Назад
        </Button>
        <div>
          <p className="font-semibold">{chatParticipant.full_name}</p>
          <p className="text-xs text-muted-foreground">{chatParticipant.email}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
        {messagesLoading ? (
          <div className="text-center py-8"><Icon name="Loader2" size={28} className="mx-auto animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="MessageSquare" size={40} className="mx-auto mb-3 opacity-30" />
            <p>Нет сообщений. Напишите первым!</p>
          </div>
        ) : messages.map(m => (
          <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
              m.sender === 'admin'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted rounded-bl-sm'
            }`}>
              <p>{m.message}</p>
              <p className={`text-xs mt-1 ${m.sender === 'admin' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                {new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                {' · '}
                {new Date(m.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 border-t pt-4">
        <Input
          value={msgText}
          onChange={e => setMsgText(e.target.value)}
          placeholder="Написать сообщение..."
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          disabled={sendingMsg}
        />
        <Button onClick={sendMessage} disabled={sendingMsg || !msgText.trim()}>
          {sendingMsg ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
        </Button>
      </div>
    </div>
  );

  // ── Список участников ──
  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
            Участники
            {totalUnread > 0 && (
              <Badge className="bg-destructive text-destructive-foreground">{totalUnread} новых</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Всего: {participants.length}</p>
        </div>
        <Button variant="outline" onClick={loadParticipants}>
          <Icon name="RefreshCw" size={15} className="mr-2" /> Обновить
        </Button>
      </div>

      <div className="mb-4">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по имени, email или городу..."
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-16"><Icon name="Loader2" size={36} className="mx-auto animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="Users" size={48} className="mx-auto mb-3 opacity-30" />
          <p>Участников не найдено</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <Card key={p.id} className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon name="User" size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.full_name || '—'}</p>
                    <p className="text-sm text-muted-foreground truncate">{p.email || '—'}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      {p.phone && <span>{p.phone}</span>}
                      {p.city && <span>{p.city}</span>}
                      {p.created_at && <span>Рег.: {new Date(p.created_at).toLocaleDateString('ru-RU')}</span>}
                      {p.applications_count > 0 && <span>Заявок: {p.applications_count}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openChat(p)} className="relative">
                    <Icon name="MessageSquare" size={15} className="mr-1" />
                    Чат
                    {p.unread_count > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {p.unread_count}
                      </span>
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteParticipant(p)}>
                    <Icon name="Trash2" size={15} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParticipantsTab;
