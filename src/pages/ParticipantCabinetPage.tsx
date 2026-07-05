import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import NewApplicationModal from '@/components/participant/NewApplicationModal';

const DIPLOMA_URL = 'https://functions.poehali.dev/1806f979-38b3-442e-b8ef-fa6827104251';
const AUTH_URL = 'https://functions.poehali.dev/52234468-777f-4edf-ba7a-985257092904';

interface Application {
  id: number;
  contest_title: string;
  category: string;
  performance_title: string | null;
  participation_format: string | null;
  nomination: string | null;
  status: string;
  submitted_at: string;
  start_date: string;
  end_date: string;
  contest_status: string;
}

interface Participant {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  birth_date: string;
  city: string;
}

interface ChatMessage {
  id: number;
  sender: 'admin' | 'user';
  message: string;
  created_at: string;
}

interface Diploma {
  diploma_number: string;
  participant_name: string;
  director_name: string;
  directing_party: string;
  piece_title: string;
  nomination: string;
  award: string;
  contest_title: string;
  contest_location: string;
  contest_event_date: string;
}

const AWARD_COLORS: Record<string, string> = {
  'Гран-При': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Лауреат I': 'bg-amber-100 text-amber-800 border-amber-300',
  'Лауреат II': 'bg-orange-100 text-orange-800 border-orange-300',
  'Лауреат III': 'bg-blue-100 text-blue-800 border-blue-300',
  'Дипломант I': 'bg-teal-100 text-teal-800 border-teal-300',
  'Дипломант II': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'Дипломант III': 'bg-sky-100 text-sky-800 border-sky-300',
  'Участник': 'bg-gray-100 text-gray-700 border-gray-300',
};

type Tab = 'applications' | 'awards' | 'shop' | 'chat';

const ParticipantCabinetPage = () => {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [diplomas, setDiplomas] = useState<Diploma[]>([]);
  const [diplomasLoading, setDiplomasLoading] = useState(false);
  const [showNewApp, setShowNewApp] = useState(false);
  const [tab, setTab] = useState<Tab>('applications');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('participantEmail');
    const data = localStorage.getItem('participantData');
    if (!email || !data) { navigate('/participant-login'); return; }
    try {
      const parsedData = JSON.parse(data);
      setParticipant(parsedData.participant);
      setApplications(parsedData.applications);
    } catch {
      navigate('/participant-login');
    }
  }, [navigate]);

  // Загружаем дипломы когда переходим на вкладку наград
  useEffect(() => {
    if (tab !== 'awards' || !participant || diplomas.length > 0) return;
    const load = async () => {
      setDiplomasLoading(true);
      try {
        // Ищем дипломы по всем заявкам участника — по номерам дипломов из программы
        // Используем поиск через diploma-check по имени участника через contest_program
        const res = await fetch(`${DIPLOMA_URL}?participant_name=${encodeURIComponent(participant.full_name)}`);
        const data = await res.json();
        if (data.diplomas) {
          setDiplomas(data.diplomas);
        } else if (data.diploma_number) {
          setDiplomas([data]);
        }
      } catch { setDiplomas([]); }
      finally { setDiplomasLoading(false); }
    };
    load();
  }, [tab, participant, diplomas.length]);

  // Загружаем чат при переходе на вкладку
  useEffect(() => {
    if (tab !== 'chat' || !participant) return;
    const load = async () => {
      setMessagesLoading(true);
      try {
        const res = await fetch(`${AUTH_URL}?action=chat&participant_id=${participant.id}`);
        const data = await res.json();
        setMessages(data.messages || []);
      } catch { setMessages([]); }
      finally { setMessagesLoading(false); }
    };
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [tab, participant]);

  useEffect(() => {
    if (tab === 'chat') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, tab]);

  const sendMessage = async () => {
    if (!msgText.trim() || !participant) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`${AUTH_URL}?action=send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant_id: participant.id, message: msgText.trim(), sender: 'user' }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages(ms => [...ms, data.message]);
        setMsgText('');
      }
    } catch {
      toast({ title: 'Ошибка отправки', variant: 'destructive' });
    } finally {
      setSendingMsg(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('participantEmail');
    localStorage.removeItem('participantData');
    toast({ title: 'Выход выполнен', description: 'До встречи!' });
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'На рассмотрении', variant: 'secondary' as const },
      approved: { label: 'Одобрена', variant: 'default' as const },
      rejected: { label: 'Отклонена', variant: 'destructive' as const }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return (
      <Badge variant={statusInfo.variant} className={statusInfo.variant === 'default' ? 'bg-green-600 hover:bg-green-700' : ''}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (!participant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" size={48} className="animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">

          {/* Шапка */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-heading font-bold mb-2">Личный кабинет</h1>
              <p className="text-muted-foreground">{participant.full_name}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <Icon name="LogOut" size={18} /> Выйти
            </Button>
          </div>

          {/* Данные участника */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="User" size={20} /> Мои данные
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ФИО</p>
                  <p className="font-medium">{participant.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{participant.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Телефон</p>
                  <p className="font-medium">{participant.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Город</p>
                  <p className="font-medium">{participant.city}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Вкладки */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <Button
              variant={tab === 'applications' ? 'default' : 'outline'}
              onClick={() => setTab('applications')}
              className="gap-2"
            >
              <Icon name="FileText" size={16} /> Мои заявки
              {applications.length > 0 && (
                <span className="ml-1 bg-background/20 rounded-full text-xs px-1.5">{applications.length}</span>
              )}
            </Button>
            <Button
              variant={tab === 'awards' ? 'default' : 'outline'}
              onClick={() => setTab('awards')}
              className="gap-2"
            >
              <Icon name="Award" size={16} /> Награды
            </Button>
            <Button
              variant={tab === 'shop' ? 'default' : 'outline'}
              onClick={() => setTab('shop')}
              className="gap-2"
            >
              <Icon name="ShoppingBag" size={16} /> Магазин
            </Button>
            <Button
              variant={tab === 'chat' ? 'default' : 'outline'}
              onClick={() => setTab('chat')}
              className="gap-2"
            >
              <Icon name="MessageSquare" size={16} /> Чат с организаторами
            </Button>
          </div>

          {/* ── Вкладка: Заявки ── */}
          {tab === 'applications' && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold">Заявки на конкурсы</h2>
                <Button onClick={() => setShowNewApp(true)} className="bg-secondary hover:bg-secondary/90 gap-2">
                  <Icon name="Plus" size={16} /> Подать заявку
                </Button>
              </div>
              {applications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Icon name="FileText" size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
                    <p className="text-muted-foreground mb-4">У вас пока нет заявок</p>
                    <Button onClick={() => setShowNewApp(true)} className="bg-secondary hover:bg-secondary/90">
                      Подать первую заявку
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <Card key={app.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="mb-2">{app.contest_title}</CardTitle>
                            <CardDescription>
                              Подано: {new Date(app.submitted_at).toLocaleDateString('ru-RU', {
                                day: 'numeric', month: 'long', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </CardDescription>
                          </div>
                          {getStatusBadge(app.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {app.category && (
                            <div>
                              <p className="text-sm text-muted-foreground">Возраст</p>
                              <p className="font-medium">{app.category}</p>
                            </div>
                          )}
                          {app.performance_title && (
                            <div>
                              <p className="text-sm text-muted-foreground">Название номера</p>
                              <p className="font-medium">{app.performance_title}</p>
                            </div>
                          )}
                          {app.nomination && (
                            <div>
                              <p className="text-sm text-muted-foreground">Номинация</p>
                              <p className="font-medium">{app.nomination}</p>
                            </div>
                          )}
                          {app.participation_format && (
                            <div>
                              <p className="text-sm text-muted-foreground">Формат</p>
                              <p className="font-medium">{app.participation_format === 'offline' ? 'Очное' : 'Заочное'}</p>
                            </div>
                          )}
                        </div>
                        {app.start_date && app.end_date && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground mb-1">Даты конкурса</p>
                            <p className="text-sm">
                              {new Date(app.start_date).toLocaleDateString('ru-RU')} — {new Date(app.end_date).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Вкладка: Награды ── */}
          {tab === 'awards' && (
            <>
              <h2 className="text-xl font-heading font-bold mb-4">Мои награды и дипломы</h2>
              {diplomasLoading ? (
                <div className="text-center py-16">
                  <Icon name="Loader2" size={40} className="mx-auto animate-spin text-muted-foreground" />
                </div>
              ) : diplomas.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Icon name="Award" size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
                    <p className="text-muted-foreground mb-2">Дипломов пока нет</p>
                    <p className="text-sm text-muted-foreground">Они появятся здесь после подведения итогов конкурса</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {diplomas.map((d) => (
                    <Card key={d.diploma_number} className="overflow-hidden">
                      <div className="border-l-4 border-secondary pl-0">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                              <p className="text-xs text-muted-foreground font-mono mb-1">{d.diploma_number}</p>
                              <CardTitle className="text-lg">{d.contest_title}</CardTitle>
                              {d.contest_event_date && (
                                <CardDescription>{d.contest_event_date}</CardDescription>
                              )}
                            </div>
                            {d.award && (
                              <span className={`shrink-0 px-3 py-1 rounded-xl text-sm font-bold border ${AWARD_COLORS[d.award] || 'bg-muted text-muted-foreground border-border'}`}>
                                {d.award}
                              </span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Участник</p>
                              <p className="font-medium">{d.participant_name}</p>
                            </div>
                            {d.nomination && (
                              <div>
                                <p className="text-muted-foreground">Номинация</p>
                                <p className="font-medium">{d.nomination}</p>
                              </div>
                            )}
                            {d.piece_title && (
                              <div>
                                <p className="text-muted-foreground">Произведение</p>
                                <p className="font-medium">{d.piece_title}</p>
                              </div>
                            )}
                            {d.director_name && (
                              <div>
                                <p className="text-muted-foreground">Руководитель</p>
                                <p className="font-medium">{d.director_name}</p>
                              </div>
                            )}
                            {d.directing_party && (
                              <div className="md:col-span-2">
                                <p className="text-muted-foreground">Направляющая сторона</p>
                                <p className="font-medium">{d.directing_party}</p>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 pt-3 border-t flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/diploma-check?diploma_number=${d.diploma_number}`)}>
                              <Icon name="ExternalLink" size={14} className="mr-1" /> Открыть диплом
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Вкладка: Магазин ── */}
          {tab === 'shop' && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="ShoppingBag" size={40} className="text-secondary" />
              </div>
              <h2 className="text-2xl font-heading font-bold mb-3">Магазин ИНДИГО</h2>
              <p className="text-muted-foreground mb-2 max-w-md mx-auto">
                Дипломы, сувениры и памятные подарки для участников конкурсов
              </p>
              <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
                Закажите именной диплом, памятную медаль или другую атрибутику с доставкой
              </p>
              <Button onClick={() => navigate('/shop')} className="bg-secondary hover:bg-secondary/90 gap-2" size="lg">
                <Icon name="ShoppingBag" size={18} /> Перейти в магазин
              </Button>
            </div>
          )}

          {/* ── Вкладка: Чат ── */}
          {tab === 'chat' && (
            <Card className="flex flex-col h-[65vh]">
              <CardHeader className="border-b shrink-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon name="MessageSquare" size={20} /> Чат с организаторами
                </CardTitle>
              </CardHeader>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <div className="text-center py-8">
                    <Icon name="Loader2" size={28} className="mx-auto animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Icon name="MessageSquare" size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Нет сообщений. Напишите нам, если есть вопросы!</p>
                  </div>
                ) : messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                      m.sender === 'user'
                        ? 'bg-secondary text-secondary-foreground rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    }`}>
                      <p>{m.message}</p>
                      <p className={`text-xs mt-1 ${m.sender === 'user' ? 'text-secondary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        {new Date(m.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2 p-4 border-t shrink-0">
                <Input
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder="Написать сообщение..."
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  disabled={sendingMsg}
                />
                <Button onClick={sendMessage} disabled={sendingMsg || !msgText.trim()} className="bg-secondary hover:bg-secondary/90">
                  {sendingMsg ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
                </Button>
              </div>
            </Card>
          )}

        </div>
      </main>

      <Footer />

      {showNewApp && participant && (
        <NewApplicationModal
          participant={participant}
          onClose={() => setShowNewApp(false)}
          onSuccess={() => {
            setShowNewApp(false);
            const data = localStorage.getItem('participantData');
            if (data) {
              const parsed = JSON.parse(data);
              setApplications(parsed.applications);
            }
          }}
        />
      )}
    </div>
  );
};

export default ParticipantCabinetPage;