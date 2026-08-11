import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { adminHeaders } from '@/config/adminApi';

const VK_CHECK_URL = 'https://functions.poehali.dev/27d46d11-5402-4428-b786-4d2eb3aace8b?endpoint=vk_check';

interface Contest {
  id: number;
  title: string;
}

interface VkApplicationRow {
  application_id: number;
  full_name: string;
  vk_link: string | null;
  status: string;
  vk_user_id: number | null;
  vk_resolved: boolean | null;
  liked: boolean | null;
  reposted: boolean | null;
  commented: boolean | null;
  subscribed: boolean | null;
  checked_at: string | null;
}

interface PostInfo {
  contest_id: number;
  post_url: string;
  owner_id: number;
  post_id: number;
  updated_at: string;
}

interface VkCheckTabProps {
  contests: Contest[];
}

const StatusIcon = ({ value }: { value: boolean | null }) => {
  if (value === null || value === undefined) {
    return <Icon name="Minus" size={16} className="text-muted-foreground" />;
  }
  return value
    ? <Icon name="Check" size={16} className="text-green-600" />
    : <Icon name="X" size={16} className="text-red-500" />;
};

const VkCheckTab = ({ contests }: VkCheckTabProps) => {
  const { toast } = useToast();
  const [selectedContestId, setSelectedContestId] = useState<string>('');
  const [postUrl, setPostUrl] = useState('');
  const [post, setPost] = useState<PostInfo | null>(null);
  const [rows, setRows] = useState<VkApplicationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [checking, setChecking] = useState(false);

  const loadData = useCallback(async (contestId: string) => {
    if (!contestId) {
      setPost(null);
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${VK_CHECK_URL}&contest_id=${contestId}`, { headers: adminHeaders() });
      const data = await res.json();
      setPost(data.post || null);
      setPostUrl(data.post?.post_url || '');
      setRows(data.applications || []);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить данные', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData(selectedContestId);
  }, [selectedContestId, loadData]);

  const handleSavePost = async () => {
    if (!selectedContestId || !postUrl.trim()) {
      toast({ title: 'Укажите конкурс и ссылку на пост', variant: 'destructive' });
      return;
    }
    setSavingPost(true);
    try {
      const res = await fetch(`${VK_CHECK_URL}&action=set_post`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ contest_id: Number(selectedContestId), post_url: postUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось сохранить ссылку', variant: 'destructive' });
        return;
      }
      toast({ title: 'Ссылка на пост сохранена' });
      loadData(selectedContestId);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить ссылку', variant: 'destructive' });
    } finally {
      setSavingPost(false);
    }
  };

  const handleRunCheck = async () => {
    if (!selectedContestId) return;
    setChecking(true);
    try {
      const res = await fetch(`${VK_CHECK_URL}&action=run_check`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ contest_id: Number(selectedContestId) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось выполнить проверку', variant: 'destructive' });
        return;
      }
      toast({ title: 'Проверка завершена', description: `Проверено ${data.checked} из ${data.total_with_vk_link} участников со ссылкой ВК` });
      loadData(selectedContestId);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось выполнить проверку', variant: 'destructive' });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-heading font-bold mb-2">Проверка ВК: лайк, репост, комментарий, подписка</h2>
        <p className="text-muted-foreground">
          Укажите конкурс и ссылку на пост в ВК — система проверит по аккаунтам участников (ссылка из заявки), кто лайкнул, репостнул, прокомментировал пост и подписан на сообщество.
        </p>
      </div>

      <Card className="p-6 mb-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Конкурс</label>
            <Select value={selectedContestId} onValueChange={setSelectedContestId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите конкурс" />
              </SelectTrigger>
              <SelectContent>
                {contests.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedContestId && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Ссылка на пост ВК</label>
                <div className="flex gap-2">
                  <Input
                    value={postUrl}
                    onChange={e => setPostUrl(e.target.value)}
                    placeholder="https://vk.com/wall-123456_789"
                  />
                  <Button onClick={handleSavePost} disabled={savingPost}>
                    {savingPost ? <Icon name="Loader2" size={16} className="animate-spin" /> : 'Сохранить'}
                  </Button>
                </div>
                {post?.updated_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Сохранено: {new Date(post.updated_at).toLocaleString('ru-RU')}
                  </p>
                )}
              </div>

              <Button
                onClick={handleRunCheck}
                disabled={checking || !post}
                className="w-full bg-secondary hover:bg-secondary/90"
              >
                {checking ? (
                  <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Проверка...</>
                ) : (
                  <><Icon name="RefreshCw" size={16} className="mr-2" />Запустить проверку</>
                )}
              </Button>
              {!post && (
                <p className="text-xs text-amber-600">Сначала сохраните ссылку на пост, затем запустите проверку</p>
              )}
            </>
          )}
        </div>
      </Card>

      {selectedContestId && (
        loading ? (
          <Card className="p-12 text-center">
            <Icon name="Loader" size={48} className="mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Загрузка...</p>
          </Card>
        ) : rows.length === 0 ? (
          <Card className="p-12 text-center">
            <Icon name="Inbox" size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Заявок по этому конкурсу не найдено</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Участник</TableHead>
                  <TableHead>Ссылка ВК</TableHead>
                  <TableHead className="text-center">Лайк</TableHead>
                  <TableHead className="text-center">Репост</TableHead>
                  <TableHead className="text-center">Комментарий</TableHead>
                  <TableHead className="text-center">Подписка</TableHead>
                  <TableHead>Проверено</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => (
                  <TableRow key={row.application_id}>
                    <TableCell className="font-medium">{row.full_name}</TableCell>
                    <TableCell>
                      {row.vk_link ? (
                        <a href={row.vk_link} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline text-sm truncate block max-w-[220px]">
                          {row.vk_link}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">не указана</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center"><StatusIcon value={row.liked} /></TableCell>
                    <TableCell className="text-center"><StatusIcon value={row.reposted} /></TableCell>
                    <TableCell className="text-center"><StatusIcon value={row.commented} /></TableCell>
                    <TableCell className="text-center"><StatusIcon value={row.subscribed} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.checked_at ? new Date(row.checked_at).toLocaleString('ru-RU') : '—'}
                      {row.vk_resolved === false && row.checked_at && (
                        <div className="text-red-500">профиль не найден</div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )
      )}
    </div>
  );
};

export default VkCheckTab;
