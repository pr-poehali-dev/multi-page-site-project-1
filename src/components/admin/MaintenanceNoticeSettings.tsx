import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const SETTINGS_URL = 'https://functions.poehali.dev/7b3c1e0e-bd68-4b73-9377-740689560912?entity=settings&key=maintenance_notice';

const MaintenanceNoticeSettings = () => {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(SETTINGS_URL);
        const data = await res.json();
        setEnabled(Boolean(data.enabled));
        setMessage(data.message || '');
      } catch {
        toast({ title: 'Не удалось загрузить настройки уведомления', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async (nextEnabled: boolean, nextMessage: string) => {
    setSaving(true);
    try {
      const res = await fetch(SETTINGS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled, message: nextMessage }),
      });
      if (!res.ok) throw new Error();
      toast({ title: nextEnabled ? 'Уведомление включено' : 'Уведомление отключено' });
    } catch {
      toast({ title: 'Не удалось сохранить настройки', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    save(checked, message);
  };

  const handleSaveMessage = () => {
    save(enabled, message);
  };

  if (loading) {
    return (
      <Card className="p-6 mb-6 flex items-center justify-center py-10">
        <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <Card className={`p-6 mb-6 border-2 transition-colors ${enabled ? 'border-amber-400 bg-amber-50/50' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 rounded-full p-2 ${enabled ? 'bg-amber-400/20 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
            <Icon name="Construction" size={20} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base flex items-center gap-2">
              Уведомление о технических работах
              {enabled && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
                  Показывается
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Показывается баннером в личном кабинете каждого участника
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Switch checked={enabled} onCheckedChange={handleToggle} disabled={saving} />
          <span className="text-sm font-medium">{enabled ? 'Включено' : 'Отключено'}</span>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium mb-2 block">Текст уведомления</label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <div className="flex justify-end mt-2">
          <Button size="sm" variant="outline" onClick={handleSaveMessage} disabled={saving}>
            <Icon name="Save" size={14} className="mr-1.5" />
            Сохранить текст
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MaintenanceNoticeSettings;
