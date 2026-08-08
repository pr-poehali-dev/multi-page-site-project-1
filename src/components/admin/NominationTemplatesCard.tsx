import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { adminHeaders } from '@/config/adminApi';

const API = 'https://functions.poehali.dev/9fcbf70c-fd6d-4489-bc77-1e4bcd6f1cb1';

interface TemplateCriterion {
  id: number;
  name: string;
  max_score: number;
}

interface TemplateItem {
  id: number;
  name: string;
  criteria: TemplateCriterion[];
}

interface NominationTemplate {
  id: number;
  name: string;
  items: TemplateItem[];
}

const NominationTemplatesCard = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<NominationTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newItemName, setNewItemName] = useState<Record<number, string>>({});
  const [newCriterion, setNewCriterion] = useState<Record<number, { name: string; max_score: string }>>({});
  const [editingTemplate, setEditingTemplate] = useState<{ id: number; name: string } | null>(null);
  const [editingItem, setEditingItem] = useState<{ id: number; name: string } | null>(null);
  const [editingCriterion, setEditingCriterion] = useState<{ id: number; name: string; max_score: string } | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}?action=nomination_templates`, { headers: adminHeaders() });
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить шаблоны номинаций', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}?action=nomination_template_create`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ name: newTemplateName.trim() }),
      });
      const data = await res.json();
      if (data.template) {
        setTemplates(prev => [...prev, data.template]);
        setNewTemplateName('');
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось создать шаблон', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleSaveTemplateName = async () => {
    if (!editingTemplate) return;
    const { id, name } = editingTemplate;
    try {
      await fetch(`${API}?action=nomination_template_update&id=${id}`, {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({ name }),
      });
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, name } : t));
      setEditingTemplate(null);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось переименовать шаблон', variant: 'destructive' });
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Удалить шаблон? Номинации, уже назначенные конкурсам, не пострадают.')) return;
    try {
      await fetch(`${API}?action=nomination_template_delete&id=${id}`, { method: 'DELETE', headers: adminHeaders() });
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить шаблон', variant: 'destructive' });
    }
  };

  const handleCreateItem = async (templateId: number) => {
    const name = newItemName[templateId]?.trim();
    if (!name) return;
    try {
      const res = await fetch(`${API}?action=nomination_template_item_create`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ template_id: templateId, name }),
      });
      const data = await res.json();
      if (data.item) {
        setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, items: [...t.items, data.item] } : t));
        setNewItemName(prev => ({ ...prev, [templateId]: '' }));
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось создать номинацию', variant: 'destructive' });
    }
  };

  const handleSaveItemName = async () => {
    if (!editingItem) return;
    const { id, name } = editingItem;
    try {
      await fetch(`${API}?action=nomination_template_item_update&id=${id}`, {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({ name }),
      });
      setTemplates(prev => prev.map(t => ({ ...t, items: t.items.map(i => i.id === id ? { ...i, name } : i) })));
      setEditingItem(null);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось переименовать номинацию', variant: 'destructive' });
    }
  };

  const handleDeleteItem = async (templateId: number, itemId: number) => {
    try {
      await fetch(`${API}?action=nomination_template_item_delete&id=${itemId}`, { method: 'DELETE', headers: adminHeaders() });
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, items: t.items.filter(i => i.id !== itemId) } : t));
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить номинацию', variant: 'destructive' });
    }
  };

  const handleCreateCriterion = async (templateId: number, itemId: number) => {
    const draft = newCriterion[itemId];
    if (!draft?.name.trim()) return;
    try {
      const res = await fetch(`${API}?action=nomination_template_criterion_create`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ template_item_id: itemId, name: draft.name.trim(), max_score: Number(draft.max_score) || 10 }),
      });
      const data = await res.json();
      if (data.criterion) {
        setTemplates(prev => prev.map(t => t.id === templateId
          ? { ...t, items: t.items.map(i => i.id === itemId ? { ...i, criteria: [...i.criteria, data.criterion] } : i) }
          : t));
        setNewCriterion(prev => ({ ...prev, [itemId]: { name: '', max_score: '10' } }));
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось создать критерий', variant: 'destructive' });
    }
  };

  const handleSaveCriterion = async () => {
    if (!editingCriterion) return;
    const { id, name, max_score } = editingCriterion;
    try {
      await fetch(`${API}?action=nomination_template_criterion_update&id=${id}`, {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({ name, max_score: Number(max_score) || 10 }),
      });
      setTemplates(prev => prev.map(t => ({
        ...t,
        items: t.items.map(i => ({
          ...i,
          criteria: i.criteria.map(c => c.id === id ? { ...c, name, max_score: Number(max_score) || 10 } : c),
        })),
      })));
      setEditingCriterion(null);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось обновить критерий', variant: 'destructive' });
    }
  };

  const handleDeleteCriterion = async (templateId: number, itemId: number, criterionId: number) => {
    try {
      await fetch(`${API}?action=nomination_template_criterion_delete&id=${criterionId}`, { method: 'DELETE', headers: adminHeaders() });
      setTemplates(prev => prev.map(t => t.id === templateId
        ? { ...t, items: t.items.map(i => i.id === itemId ? { ...i, criteria: i.criteria.filter(c => c.id !== criterionId) } : i) }
        : t));
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить критерий', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-1">Шаблоны номинаций</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Создайте набор номинаций с критериями один раз — затем назначьте его на любой конкурс на вкладке «Номинации», не пересоздавая список каждый раз.
        </p>
        <div className="flex gap-2">
          <Input
            value={newTemplateName}
            onChange={e => setNewTemplateName(e.target.value)}
            placeholder="Название шаблона, например «Стандартный набор»"
            onKeyDown={e => e.key === 'Enter' && handleCreateTemplate()}
          />
          <Button onClick={handleCreateTemplate} disabled={creating || !newTemplateName.trim()}>
            {creating ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Plus" size={16} />}
            <span className="ml-2 hidden sm:inline">Добавить шаблон</span>
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8"><Icon name="Loader" size={28} className="animate-spin text-muted-foreground" /></div>
      ) : templates.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Шаблоны ещё не созданы</Card>
      ) : (
        templates.map(tpl => (
          <Card key={tpl.id} className="p-4 border-2 border-primary/10">
            <div className="flex items-center justify-between mb-3">
              {editingTemplate?.id === tpl.id ? (
                <div className="flex gap-2 flex-1 mr-2">
                  <Input
                    value={editingTemplate.name}
                    onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleSaveTemplateName()}
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveTemplateName}><Icon name="Check" size={14} /></Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingTemplate(null)}><Icon name="X" size={14} /></Button>
                </div>
              ) : (
                <h4 className="text-base font-semibold flex items-center gap-2">
                  <Icon name="LayoutTemplate" size={16} className="text-primary" />
                  {tpl.name}
                </h4>
              )}
              {editingTemplate?.id !== tpl.id && (
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setEditingTemplate({ id: tpl.id, name: tpl.name })}>
                    <Icon name="Pencil" size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteTemplate(tpl.id)}>
                    <Icon name="Trash2" size={14} className="text-destructive" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3 pl-2 border-l-2 border-muted">
              {tpl.items.map(item => (
                <div key={item.id} className="pl-3">
                  <div className="flex items-center justify-between mb-2">
                    {editingItem?.id === item.id ? (
                      <div className="flex gap-2 flex-1 mr-2">
                        <Input
                          className="h-8 text-sm"
                          value={editingItem.name}
                          onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                          onKeyDown={e => e.key === 'Enter' && handleSaveItemName()}
                          autoFocus
                        />
                        <Button size="sm" onClick={handleSaveItemName}><Icon name="Check" size={13} /></Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}><Icon name="X" size={13} /></Button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium">{item.name}</p>
                    )}
                    {editingItem?.id !== item.id && (
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => setEditingItem({ id: item.id, name: item.name })}>
                          <Icon name="Pencil" size={13} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(tpl.id, item.id)}>
                          <Icon name="Trash2" size={13} className="text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 mb-2">
                    {item.criteria.map(c => (
                      <div key={c.id} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-1.5">
                        {editingCriterion?.id === c.id ? (
                          <>
                            <Input
                              className="h-7 text-xs flex-1"
                              value={editingCriterion.name}
                              onChange={e => setEditingCriterion({ ...editingCriterion, name: e.target.value })}
                            />
                            <Input
                              type="number"
                              className="h-7 text-xs w-16"
                              value={editingCriterion.max_score}
                              onChange={e => setEditingCriterion({ ...editingCriterion, max_score: e.target.value })}
                            />
                            <Button size="sm" onClick={handleSaveCriterion}><Icon name="Check" size={12} /></Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingCriterion(null)}><Icon name="X" size={12} /></Button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-xs">{c.name}</span>
                            <span className="text-xs text-muted-foreground">до {c.max_score} баллов</span>
                            <Button size="sm" variant="ghost" onClick={() => setEditingCriterion({ id: c.id, name: c.name, max_score: String(c.max_score) })}>
                              <Icon name="Pencil" size={12} />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteCriterion(tpl.id, item.id, c.id)}>
                              <Icon name="Trash2" size={12} className="text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                    {item.criteria.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">Критерии ещё не добавлены</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      className="h-7 text-xs"
                      placeholder="Критерий, например «Артистизм»"
                      value={newCriterion[item.id]?.name || ''}
                      onChange={e => setNewCriterion(prev => ({ ...prev, [item.id]: { name: e.target.value, max_score: prev[item.id]?.max_score || '10' } }))}
                      onKeyDown={e => e.key === 'Enter' && handleCreateCriterion(tpl.id, item.id)}
                    />
                    <Input
                      type="number"
                      className="h-7 text-xs w-16"
                      placeholder="Баллы"
                      value={newCriterion[item.id]?.max_score ?? '10'}
                      onChange={e => setNewCriterion(prev => ({ ...prev, [item.id]: { name: prev[item.id]?.name || '', max_score: e.target.value } }))}
                    />
                    <Button size="sm" onClick={() => handleCreateCriterion(tpl.id, item.id)}>
                      <Icon name="Plus" size={13} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t">
              <Input
                className="h-8 text-sm"
                placeholder="Новая номинация в шаблоне, например «Хореография соло»"
                value={newItemName[tpl.id] || ''}
                onChange={e => setNewItemName(prev => ({ ...prev, [tpl.id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleCreateItem(tpl.id)}
              />
              <Button size="sm" onClick={() => handleCreateItem(tpl.id)}>
                <Icon name="Plus" size={14} className="mr-1" /> Номинация
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default NominationTemplatesCard;