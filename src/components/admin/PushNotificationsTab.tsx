import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { adminHeaders } from '@/config/adminApi';

const AUTH_URL = 'https://functions.poehali.dev/52234468-777f-4edf-ba7a-985257092904';
const CONTESTS_URL = 'https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3';

interface Contest {
  id: number;
  title: string;
}

const PushNotificationsTab = () => {
  const { toast } = useToast();
  const [tokensCount, setTokensCount] = useState<number | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<string>('none');

  const loadTokensCount = async () => {
    setLoadingTokens(true);
    try {
      const res = await fetch(`${AUTH_URL}?action=list_push_tokens`, { headers: adminHeaders() });
      const data = await res.json();
      setTokensCount((data.tokens || []).length);
    } catch {
      setTokensCount(null);
    } finally {
      setLoadingTokens(false);
    }
  };

  const loadContests = async () => {
    try {
      const res = await fetch(CONTESTS_URL);
      const data = await res.json();
      setContests(data.contests || []);
    } catch {
      setContests([]);
    }
  };

  useEffect(() => {
    loadTokensCount();
    loadContests();
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: 'Заполните заголовок и текст уведомления', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${CONTESTS_URL}?action=send_push`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          contest_id: selectedContestId !== 'none' ? Number(selectedContestId) : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: 'Ошибка отправки', description: data.error || 'Не удалось разослать уведомление', variant: 'destructive' });
        return;
      }

      if (data.total === 0) {
        toast({ title: 'Нет ни одного участника с включёнными уведомлениями', variant: 'destructive' });
        return;
      }

      toast({ title: 'Уведомление отправлено', description: `Разослано ${data.sent} из ${data.total} участникам` });
      setTitle('');
      setBody('');
      setSelectedContestId('none');
    } catch {
      toast({ title: 'Ошибка отправки', description: 'Не удалось разослать уведомление', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold">Push-уведомления</h2>
          <p className="text-muted-foreground">
            {loadingTokens ? 'Загрузка...' : tokensCount !== null ? `Получат уведомление: ${tokensCount} участников` : 'Не удалось получить количество получателей'}
          </p>
        </div>
        <Button variant="outline" onClick={loadTokensCount}>
          <Icon name="RefreshCw" size={16} className="mr-2" />
          Обновить
        </Button>
      </div>

      <Card className="p-6 max-w-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Заголовок</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Например: Новый конкурс открыт!"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Текст уведомления</label>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Например: Регистрация на «Таланты Нягань 2025» уже началась"
              rows={4}
              maxLength={300}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Ссылка на конкурс (по желанию)</label>
            <Select value={selectedContestId} onValueChange={setSelectedContestId}>
              <SelectTrigger>
                <SelectValue placeholder="Без ссылки" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без ссылки</SelectItem>
                {contests.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">При нажатии на уведомление приложение откроет страницу выбранного конкурса</p>
          </div>
          <Button
            onClick={handleSend}
            disabled={sending || loadingTokens || !tokensCount}
            className="w-full bg-secondary hover:bg-secondary/90"
          >
            {sending ? (
              <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Отправка...</>
            ) : (
              <><Icon name="Send" size={16} className="mr-2" />Отправить всем участникам</>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PushNotificationsTab;