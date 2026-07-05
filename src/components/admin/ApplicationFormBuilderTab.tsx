import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API = 'https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3';

interface Contest {
  id: number;
  title: string;
  form_template_id?: number | null;
}

interface Template {
  id: number;
  name: string;
  created_at: string;
  fields_count: number;
}

interface FormField {
  id?: number;
  field_name: string;
  field_label: string;
  field_type: string;
  options: string;
  is_required: boolean;
  sort_order: number;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Текст' },
  { value: 'number', label: 'Число' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Телефон' },
  { value: 'textarea', label: 'Многострочный текст' },
  { value: 'select', label: 'Список (выпадающий)' },
  { value: 'checkbox', label: 'Чекбокс (да/нет)' },
  { value: 'date', label: 'Дата' },
  { value: 'file', label: 'Файл' },
];

interface Props {
  contests: Contest[];
}

const ApplicationFormBuilderTab = ({ contests }: Props) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}?action=templates`);
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch { setTemplates([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTemplates(); }, []);

  const createTemplate = async () => {
    if (!newTemplateName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}?action=template_create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTemplateName.trim() }),
      });
      const data = await res.json();
      if (data.id) {
        toast({ title: 'Шаблон создан' });
        setNewTemplateName('');
        await loadTemplates();
      }
    } catch { toast({ title: 'Ошибка создания', variant: 'destructive' }); }
    finally { setCreating(false); }
  };

  const deleteTemplate = async (t: Template) => {
    if (!confirm(`Удалить шаблон «${t.name}»? Он будет отвязан от всех конкурсов.`)) return;
    try {
      await fetch(`${API}?action=template_delete&id=${t.id}`, { method: 'DELETE' });
      setTemplates(ts => ts.filter(x => x.id !== t.id));
      toast({ title: 'Шаблон удалён' });
    } catch { toast({ title: 'Ошибка удаления', variant: 'destructive' }); }
  };

  const openEditor = async (t: Template) => {
    setActiveTemplate(t);
    setView('editor');
    try {
      const res = await fetch(`${API}?action=template_fields&template_id=${t.id}`);
      const data = await res.json();
      setFields((data.fields || []).map((f: FormField) => ({ ...f, options: f.options || '' })));
    } catch { setFields([]); }
  };

  const addField = () => {
    setFields(fs => [...fs, {
      field_name: `field_${fs.length + 1}`,
      field_label: '',
      field_type: 'text',
      options: '',
      is_required: false,
      sort_order: fs.length,
    }]);
  };

  const updateField = (i: number, key: keyof FormField, val: string | boolean | number) => {
    setFields(fs => fs.map((f, idx) => idx === i ? { ...f, [key]: val } : f));
  };

  const removeField = (i: number) => {
    setFields(fs => fs.filter((_, idx) => idx !== i));
  };

  const saveFields = async () => {
    if (!activeTemplate) return;
    setSaving(true);
    try {
      await fetch(`${API}?action=fields_save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: activeTemplate.id,
          fields: fields.map((f, i) => ({ ...f, sort_order: i })),
        }),
      });
      toast({ title: 'Поля сохранены' });
      await loadTemplates();
    } catch { toast({ title: 'Ошибка сохранения', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const assignTemplate = async (contestId: number, templateId: number | null) => {
    try {
      await fetch(`${API}?action=assign_template`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contest_id: contestId, template_id: templateId }),
      });
      toast({ title: templateId ? 'Форма назначена конкурсу' : 'Форма снята с конкурса' });
    } catch { toast({ title: 'Ошибка назначения', variant: 'destructive' }); }
  };

  // ── Экран редактора полей ──
  if (view === 'editor' && activeTemplate) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" onClick={() => { setView('list'); setActiveTemplate(null); }}>
            <Icon name="ArrowLeft" size={16} className="mr-2" /> Назад
          </Button>
          <h2 className="text-xl font-semibold">Поля формы: {activeTemplate.name}</h2>
        </div>

        <Card className="p-5 mb-4">
          <div className="space-y-3">
            {fields.map((f, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <label className="text-xs text-muted-foreground mb-1 block">Название вопроса</label>
                    <Input value={f.field_label} onChange={e => updateField(i, 'field_label', e.target.value)} placeholder="Например: Название номера" />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs text-muted-foreground mb-1 block">Тип поля</label>
                    <Select value={f.field_type} onValueChange={v => updateField(i, 'field_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs text-muted-foreground mb-1 block">Системное имя</label>
                    <Input value={f.field_name} onChange={e => updateField(i, 'field_name', e.target.value)} placeholder="field_name" />
                  </div>
                  <div className="col-span-1 flex flex-col items-center gap-1">
                    <label className="text-xs text-muted-foreground">Обяз.</label>
                    <input type="checkbox" checked={f.is_required} onChange={e => updateField(i, 'is_required', e.target.checked)} className="w-4 h-4 cursor-pointer" />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button variant="ghost" size="sm" onClick={() => removeField(i)} className="text-destructive hover:text-destructive">
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </div>
                </div>
                {f.field_type === 'select' && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Варианты (через запятую)</label>
                    <Input value={f.options} onChange={e => updateField(i, 'options', e.target.value)} placeholder="Вокал, Танцы, Театр" />
                  </div>
                )}
              </div>
            ))}
            {fields.length === 0 && <p className="text-muted-foreground text-center py-6">Нет полей. Добавьте первый вопрос.</p>}
          </div>
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" onClick={addField}>
            <Icon name="Plus" size={16} className="mr-2" /> Новый вопрос
          </Button>
          <Button onClick={saveFields} disabled={saving} className="bg-secondary hover:bg-secondary/90">
            {saving ? <Icon name="Loader2" size={16} className="mr-2 animate-spin" /> : <Icon name="Save" size={16} className="mr-2" />}
            Сохранить поля
          </Button>
        </div>
      </div>
    );
  }

  // ── Список шаблонов + назначение конкурсам ──
  return (
    <div>
      <h2 className="text-2xl font-heading font-bold mb-1">Конструктор заявок</h2>
      <p className="text-muted-foreground mb-6">Создавайте формы заявок и назначайте их конкурсам</p>

      <Card className="p-5 mb-6">
        <h3 className="font-semibold mb-3">Шаблоны форм</h3>
        <div className="flex gap-2 mb-4">
          <Input
            value={newTemplateName}
            onChange={e => setNewTemplateName(e.target.value)}
            placeholder="Название нового шаблона, например «Вокал соло»"
            onKeyDown={e => e.key === 'Enter' && createTemplate()}
          />
          <Button onClick={createTemplate} disabled={creating || !newTemplateName.trim()}>
            <Icon name="Plus" size={16} className="mr-2" /> Создать
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8"><Icon name="Loader2" size={28} className="mx-auto animate-spin text-muted-foreground" /></div>
        ) : templates.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">Нет шаблонов. Создайте первый.</p>
        ) : (
          <div className="space-y-2">
            {templates.map(t => (
              <div key={t.id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">Полей: {t.fields_count}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditor(t)}>
                    <Icon name="Pencil" size={14} className="mr-1" /> Редактировать
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteTemplate(t)}>
                    <Icon name="Trash2" size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Назначение форм конкурсам</h3>
        {contests.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">Нет конкурсов</p>
        ) : (
          <div className="space-y-2">
            {contests.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 border rounded-lg p-3 flex-wrap">
                <p className="font-medium flex-1 min-w-[200px]">{c.title}</p>
                <Select
                  value={c.form_template_id ? String(c.form_template_id) : 'none'}
                  onValueChange={v => assignTemplate(c.id, v === 'none' ? null : Number(v))}
                >
                  <SelectTrigger className="w-56"><SelectValue placeholder="Без доп. формы" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без доп. формы</SelectItem>
                    {templates.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ApplicationFormBuilderTab;
