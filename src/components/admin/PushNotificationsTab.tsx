import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { adminHeaders } from '@/config/adminApi';

const AUTH_URL = 'https://functions.poehali.dev/52234468-777f-4edf-ba7a-985257092904';
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const PushNotificationsTab = () => {
  const { toast } = useToast();
  const [tokensCount, setTokensCount] = useState<number | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

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

  useEffect(() => {
    loadTokensCount();
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: 'Заполните заголовок и текст уведомления', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const tokensRes = await fetch(`${AUTH_URL}?action=list_push_tokens`, { headers: adminHeaders() });
      const tokensData = await tokensRes.json();
      const tokens: string[] = tokensData.tokens || [];

      if (tokens.length === 0) {
        toast({ title: 'Нет ни одного участника с включёнными уведомлениями', variant: 'destructive' });
        setSending(false);
        return;
      }

      const chunkSize = 100;
      let sentCount = 0;
      for (let i = 0; i < tokens.length; i += chunkSize) {
        const chunk = tokens.slice(i, i + chunkSize);
        const messages = chunk.map(token => ({
          to: token,
          title: title.trim(),
          body: body.trim(),
        }));
        const res = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(messages),
        });
        if (res.ok) sentCount += chunk.length;
      }

      toast({ title: 'Уведомление отправлено', description: `Разослано ${sentCount} из ${tokens.length} участникам` });
      setTitle('');
      setBody('');
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
