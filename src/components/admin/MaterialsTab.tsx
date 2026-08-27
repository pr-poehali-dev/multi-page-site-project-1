import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { adminHeaders } from '@/config/adminApi';

const API = 'https://functions.poehali.dev/27d46d11-5402-4428-b786-4d2eb3aace8b';

interface ApplicationRow {
  id: number;
  contest_id: number;
  contest_title: string;
  full_name: string;
  performance_title?: string;
  materials_link?: string | null;
  start_date?: string;
  end_date?: string;
  event_date?: string;
}

interface Contest {
  id: number;
  title: string;
}

interface MaterialsTabProps {
  contests: Contest[];
}

const formatContestDate = (app: ApplicationRow) => {
  if (app.event_date) return app.event_date;
  if (app.start_date && app.end_date) {
    const start = new Date(app.start_date).toLocaleDateString('ru-RU');
    const end = new Date(app.end_date).toLocaleDateString('ru-RU');
    return start === end ? start : `${start} — ${end}`;
  }
  if (app.start_date) return new Date(app.start_date).toLocaleDateString('ru-RU');
  return '';
};

const MaterialsTab = ({ contests }: MaterialsTabProps) => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [contestFilter, setContestFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (contestFilter !== 'all') params.append('contest_id', contestFilter);
      const res = await fetch(`${API}?${params}`, { headers: adminHeaders() });
      const data = await res.json();
      const list: ApplicationRow[] = data.applications || [];
      setApplications(list);
      setDrafts((prev) => {
        const next = { ...prev };
        list.forEach((a) => {
          if (next[a.id] === undefined) next[a.id] = a.materials_link || '';
        });
        return next;
      });
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contestFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((a) => a.full_name?.toLowerCase().includes(q));
  }, [applications, search]);

  const handleSave = async (app: ApplicationRow) => {
    const value = (drafts[app.id] || '').trim();
    setSavingId(app.id);
    try {
      const res = await fetch(`${API}?action=set_materials_link`, {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({ application_id: app.id, materials_link: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, materials_link: value } : a)));
      toast({ title: value ? 'Ссылка сохранена' : 'Ссылка удалена' });
    } catch (e: unknown) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-heading font-bold mb-1">Материалы по проектам</h2>
        <p className="text-muted-foreground">
          Укажите ссылку на папку с фото/видео с выступления (Яндекс.Диск, Облако Mail.ru) — участник увидит кнопку в личном кабинете
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          placeholder="Поиск по имени участника..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <select
          className="border rounded-md px-3 py-2 text-sm bg-background"
          value={contestFilter}
          onChange={(e) => setContestFilter(e.target.value)}
        >
          <option value="all">Все конкурсы</option>
          {contests.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted-foreground">
          <Icon name="Loader2" size={28} className="animate-spin mx-auto mb-2" />
          Загрузка...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">Заявки не найдены</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const draft = drafts[app.id] ?? '';
            const dirty = draft.trim() !== (app.materials_link || '');
            return (
              <Card key={app.id} className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                  <div className="min-w-0 md:w-64 shrink-0">
                    <p className="font-medium truncate">{app.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {app.contest_title}{formatContestDate(app) ? ` • ${formatContestDate(app)}` : ''}
                    </p>
                    {app.performance_title && (
                      <p className="text-xs text-muted-foreground truncate">{app.performance_title}</p>
                    )}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="https://disk.yandex.ru/... или https://cloud.mail.ru/..."
                      value={draft}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [app.id]: e.target.value }))}
                    />
                    <Button
                      onClick={() => handleSave(app)}
                      disabled={!dirty || savingId === app.id}
                      className="shrink-0"
                    >
                      {savingId === app.id ? (
                        <Icon name="Loader2" size={16} className="animate-spin" />
                      ) : (
                        'Сохранить'
                      )}
                    </Button>
                    {app.materials_link && (
                      <Button variant="outline" className="shrink-0" asChild>
                        <a href={app.materials_link} target="_blank" rel="noopener noreferrer">
                          <Icon name="ExternalLink" size={16} />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MaterialsTab;
