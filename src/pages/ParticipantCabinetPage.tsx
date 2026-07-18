import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import NewApplicationModal from '@/components/participant/NewApplicationModal';
import EditApplicationModal from '@/components/participant/EditApplicationModal';
import ParticipantHeader, { Participant } from '@/components/participant/ParticipantHeader';
import CabinetApplicationsTab, { Application } from '@/components/participant/CabinetApplicationsTab';
import CabinetAwardsTab, { Diploma } from '@/components/participant/CabinetAwardsTab';
import CabinetChatTab, { ChatMessage } from '@/components/participant/CabinetChatTab';
import CabinetOrdersTab, { ShopOrder } from '@/components/participant/CabinetOrdersTab';

const DIPLOMA_URL = 'https://functions.poehali.dev/1806f979-38b3-442e-b8ef-fa6827104251';
const AUTH_URL = 'https://functions.poehali.dev/52234468-777f-4edf-ba7a-985257092904';
const CONTESTS_URL = 'https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3';
const ORDERS_URL = 'https://functions.poehali.dev/b020db38-8100-400d-9e53-2dbfcafd5f48';

type Tab = 'applications' | 'awards' | 'shop' | 'chat';

const ParticipantCabinetPage = () => {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [diplomas, setDiplomas] = useState<Diploma[]>([]);
  const [diplomasLoading, setDiplomasLoading] = useState(false);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showNewApp, setShowNewApp] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [fieldLabelsByContest, setFieldLabelsByContest] = useState<Record<number, Record<string, string>>>({});
  const [tab, setTab] = useState<Tab>('applications');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const applyContestId = searchParams.get('apply') || undefined;

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

  // Автоматически открываем форму подачи заявки, если пришли по ссылке "Подать заявку" с конкурса
  useEffect(() => {
    if (participant && applyContestId) {
      setShowNewApp(true);
    }
  }, [participant, applyContestId]);

  // Загружаем подписи дополнительных вопросов для отображения ответов в заявках
  useEffect(() => {
    const contestIds = Array.from(new Set(applications.map(a => a.contest_id).filter(Boolean)));
    const toLoad = contestIds.filter(id => !fieldLabelsByContest[id]);
    if (toLoad.length === 0) return;
    const load = async () => {
      for (const contestId of toLoad) {
        try {
          const res = await fetch(`${CONTESTS_URL}?action=contest_form&contest_id=${contestId}`);
          const data = await res.json();
          const labels: Record<string, string> = {};
          (data.fields || []).forEach((f: { field_name: string; field_label: string }) => {
            labels[f.field_name] = f.field_label;
          });
          setFieldLabelsByContest(prev => ({ ...prev, [contestId]: labels }));
        } catch {
          setFieldLabelsByContest(prev => ({ ...prev, [contestId]: {} }));
        }
      }
    };
    load();
  }, [applications, fieldLabelsByContest]);

  const handleCloseNewApp = () => {
    setShowNewApp(false);
    if (applyContestId) {
      searchParams.delete('apply');
      setSearchParams(searchParams, { replace: true });
    }
  };

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

  // Загружаем заказы магазина когда переходим на вкладку
  useEffect(() => {
    if (tab !== 'shop' || !participant || orders.length > 0) return;
    const load = async () => {
      setOrdersLoading(true);
      try {
        const res = await fetch(`${ORDERS_URL}?email=${encodeURIComponent(participant.email)}`);
        const data = await res.json();
        setOrders(data.orders || []);
      } catch { setOrders([]); }
      finally { setOrdersLoading(false); }
    };
    load();
  }, [tab, participant, orders.length]);

  // Загружаем чат при переходе на вкладку и помечаем прочитанным
  useEffect(() => {
    if (tab !== 'chat' || !participant) return;
    const load = async () => {
      setMessagesLoading(true);
      try {
        const res = await fetch(`${AUTH_URL}?action=chat&participant_id=${participant.id}`);
        const data = await res.json();
        setMessages(data.messages || []);
        await fetch(`${AUTH_URL}?action=read&participant_id=${participant.id}&reader=user`, { method: 'PUT' });
        setUnreadCount(0);
      } catch { setMessages([]); }
      finally { setMessagesLoading(false); }
    };
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [tab, participant]);

  // Проверяем непрочитанные сообщения от организаторов (пока не в чате)
  useEffect(() => {
    if (!participant) return;
    const checkUnread = async () => {
      if (tab === 'chat') return;
      try {
        const res = await fetch(`${AUTH_URL}?action=unread&participant_id=${participant.id}`);
        const data = await res.json();
        setUnreadCount(data.unread_count || 0);
      } catch { /* ignore */ }
    };
    checkUnread();
    const interval = setInterval(checkUnread, 15000);
    return () => clearInterval(interval);
  }, [participant, tab]);

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

          <ParticipantHeader participant={participant} onLogout={handleLogout} />

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
              <Icon name="ShoppingBag" size={16} /> Мои заказы
              {orders.length > 0 && (
                <span className="ml-1 bg-background/20 rounded-full text-xs px-1.5">{orders.length}</span>
              )}
            </Button>
            <Button
              variant={tab === 'chat' ? 'default' : 'outline'}
              onClick={() => setTab('chat')}
              className="gap-2 relative"
            >
              <Icon name="MessageSquare" size={16} /> Чат с организаторами
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>
          </div>

          {/* ── Вкладка: Заявки ── */}
          {tab === 'applications' && (
            <CabinetApplicationsTab
              applications={applications}
              fieldLabelsByContest={fieldLabelsByContest}
              onNewApplication={() => setShowNewApp(true)}
              onEditApplication={(app) => setEditingApplication(app)}
            />
          )}

          {/* ── Вкладка: Награды ── */}
          {tab === 'awards' && (
            <CabinetAwardsTab diplomas={diplomas} diplomasLoading={diplomasLoading} />
          )}

          {/* ── Вкладка: Магазин ── */}
          {tab === 'shop' && (
            <CabinetOrdersTab
              orders={orders}
              loading={ordersLoading}
              onGoToShop={() => navigate('/shop')}
            />
          )}

          {/* ── Вкладка: Чат ── */}
          {tab === 'chat' && (
            <CabinetChatTab
              messages={messages}
              messagesLoading={messagesLoading}
              msgText={msgText}
              setMsgText={setMsgText}
              sendingMsg={sendingMsg}
              sendMessage={sendMessage}
              messagesEndRef={messagesEndRef}
            />
          )}

        </div>
      </main>

      <Footer />

      {showNewApp && participant && (
        <NewApplicationModal
          participant={participant}
          initialContestId={applyContestId}
          onClose={handleCloseNewApp}
          onSuccess={() => {
            handleCloseNewApp();
            const data = localStorage.getItem('participantData');
            if (data) {
              const parsed = JSON.parse(data);
              setApplications(parsed.applications);
            }
          }}
        />
      )}

      {editingApplication && (
        <EditApplicationModal
          application={editingApplication}
          onClose={() => setEditingApplication(null)}
          onSuccess={() => {
            setEditingApplication(null);
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