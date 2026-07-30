import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API = 'https://functions.poehali.dev/9fcbf70c-fd6d-4489-bc77-1e4bcd6f1cb1';

export interface Criterion {
  id: number;
  name: string;
  max_score: number;
}

export interface Nomination {
  id: number;
  contest_id: number;
  name: string;
  criteria: Criterion[];
}

interface NominationTemplateOption {
  id: number;
  name: string;
}

interface NominationsCardProps {
  contestId: string;
}

const NominationsCard = ({ contestId }: NominationsCardProps) => {
  const { toast } = useToast();
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNominationName, setNewNominationName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newCriterion, setNewCriterion] = useState<Record<number, { name: string; max_score: string }>>({});
  const [editingNomination, setEditingNomination] = useState<{ id: number; name: string } | null>(null);
  const [editingCriterion, setEditingCriterion] = useState<{ id: number; name: string; max_score: string } | null>(null);
  const [templates, setTemplates] = useState<NominationTemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [applyingTemplate, setApplyingTemplate] = useState(false);

  const loadNominations = useCallback(async () => {
    if (!contestId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}?action=nominations&contest_id=${contestId}`);
      const data = await res.json();
      setNominations(data.nominations || []);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить номинации', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [contestId, toast]);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch(`${API}?action=nomination_templates`);
      const data = await res.json();
      setTemplates((data.templates || []).map((t: { id: number; name: string }) => ({ id: t.id, name: t.name })));
    } catch {
      setTemplates([]);
    }
  }, []);

  useEffect(() => { loadNominations(); }, [loadNominations]);
  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId || !contestId) return;
    setApplyingTemplate(true);
    try {
      const res = await fetch(`${API}?action=apply_nomination_template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contest_id: Number(contestId), template_id: Number(selectedTemplateId) }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Шаблон назначен', description: `Добавлено номинаций: ${data.created}${data.skipped > 0 ? `, пропущено (уже есть): ${data.skipped}` : ''}` });
        setSelectedTemplateId('');
        loadNominations();
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось назначить шаблон', variant: 'destructive' });
    } finally {
      setApplyingTemplate(false);
    }
  };

  const handleCreateNomination = async () => {
    if (!newNominationName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}?action=nomination_create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contest_id: Number(contestId), name: newNominationName.trim() }),
      });
      const data = await res.json();
      if (data.nomination) {
        setNominations(prev => [...prev, data.nomination]);
        setNewNominationName('');
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось создать номинацию', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleSaveNominationName = async () => {
    if (!editingNomination) return;
    const { id, name } = editingNomination;
    try {
      await fetch(`${API}?action=nomination_update&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      setNominations(prev => prev.map(n => n.id === id ? { ...n, name } : n));
      setEditingNomination(null);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось переименовать номинацию', variant: 'destructive' });
    }
  };

  const handleDeleteNomination = async (id: number) => {
    try {
      await fetch(`${API}?action=nomination_delete&id=${id}`, { method: 'DELETE' });
      setNominations(prev => prev.filter(n => n.id !== id));
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить номинацию', variant: 'destructive' });
    }
  };

  const handleCreateCriterion = async (nominationId: number) => {
    const draft = newCriterion[nominationId];
    if (!draft?.name.trim()) return;
    try {
      const res = await fetch(`${API}?action=criterion_create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomination_id: nominationId, name: draft.name.trim(), max_score: Number(draft.max_score) || 10 }),
      });
      const data = await res.json();
      if (data.criterion) {
        setNominations(prev => prev.map(n => n.id === nominationId ? { ...n, criteria: [...n.criteria, data.criterion] } : n));
        setNewCriterion(prev => ({ ...prev, [nominationId]: { name: '', max_score: '10' } }));
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось создать критерий', variant: 'destructive' });
    }
  };

  const handleSaveCriterion = async () => {
    if (!editingCriterion) return;
    const { id, name, max_score } = editingCriterion;
    try {
      await fetch(`${API}?action=criterion_update&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, max_score: Number(max_score) || 10 }),
      });
      setNominations(prev => prev.map(n => ({
        ...n,
        criteria: n.criteria.map(c => c.id === id ? { ...c, name, max_score: Number(max_score) || 10 } : c),
      })));
      setEditingCriterion(null);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось обновить критерий', variant: 'destructive' });
    }
  };

  const handleDeleteCriterion = async (nominationId: number, criterionId: number) => {
    try {
      await fetch(`${API}?action=criterion_delete&id=${criterionId}`, { method: 'DELETE' });
      setNominations(prev => prev.map(n => n.id === nominationId ? { ...n, criteria: n.criteria.filter(c => c.id !== criterionId) } : n));
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить критерий', variant: 'destructive' });
    }
  };

  if (!contestId) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Выберите конкурс, чтобы настроить номинации
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-1">Номинации конкурса</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Создайте номинации и критерии оценивания с количеством баллов. Итоговое звание участника считается по сумме баллов всех критериев его номинации.
        </p>
        <div className="flex gap-2">
          <Input
            value={newNominationName}
            onChange={e => setNewNominationName(e.target.value)}
            placeholder="Название номинации, например «Вокал соло»"
            onKeyDown={e => e.key === 'Enter' && handleCreateNomination()}
          />
          <Button onClick={handleCreateNomination} disabled={creating || !newNominationName.trim()}>
            {creating ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Plus" size={16} />}
            <span className="ml-2 hidden sm:inline">Добавить</span>
          </Button>
        </div>

        {templates.length > 0 && (
          <div className="flex gap-2 mt-3 pt-3 border-t items-center">
            <Icon name="LayoutTemplate" size={16} className="text-muted-foreground shrink-0" />
            <div className="flex-1">
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger><SelectValue placeholder="Назначить готовый шаблон номинаций" /></SelectTrigger>
                <SelectContent>
                  {templates.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="secondary" onClick={handleApplyTemplate} disabled={!selectedTemplateId || applyingTemplate}>
              {applyingTemplate ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Check" size={16} />}
              <span className="ml-2 hidden sm:inline">Назначить</span>
            </Button>
          </div>
        )}
      </Card>

      {loading ? (
        <div className="flex justify-center py-8"><Icon name="Loader" size={28} className="animate-spin text-muted-foreground" /></div>
      ) : nominations.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Номинации ещё не созданы</Card>
      ) : (
        nominations.map(nom => (
          <Card key={nom.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              {editingNomination?.id === nom.id ? (
                <div className="flex gap-2 flex-1 mr-2">
                  <Input
                    value={editingNomination.name}
                    onChange={e => setEditingNomination({ ...editingNomination, name: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleSaveNominationName()}
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveNominationName}><Icon name="Check" size={14} /></Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingNomination(null)}><Icon name="X" size={14} /></Button>
                </div>
              ) : (
                <h4 className="text-base font-semibold">{nom.name}</h4>
              )}
              {editingNomination?.id !== nom.id && (
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setEditingNomination({ id: nom.id, name: nom.name })}>
                    <Icon name="Pencil" size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteNomination(nom.id)}>
                    <Icon name="Trash2" size={14} className="text-destructive" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2 mb-3">
              {nom.criteria.map(c => (
                <div key={c.id} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                  {editingCriterion?.id === c.id ? (
                    <>
                      <Input
                        className="h-8 text-sm flex-1"
                        value={editingCriterion.name}
                        onChange={e => setEditingCriterion({ ...editingCriterion, name: e.target.value })}
                      />
                      <Input
                        type="number"
                        className="h-8 text-sm w-20"
                        value={editingCriterion.max_score}
                        onChange={e => setEditingCriterion({ ...editingCriterion, max_score: e.target.value })}
                      />
                      <Button size="sm" onClick={handleSaveCriterion}><Icon name="Check" size={14} /></Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingCriterion(null)}><Icon name="X" size={14} /></Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">{c.name}</span>
                      <span className="text-xs text-muted-foreground">до {c.max_score} баллов</span>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCriterion({ id: c.id, name: c.name, max_score: String(c.max_score) })}>
                        <Icon name="Pencil" size={13} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteCriterion(nom.id, c.id)}>
                        <Icon name="Trash2" size={13} className="text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
              {nom.criteria.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Критерии ещё не добавлены</p>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                className="h-8 text-sm"
                placeholder="Название критерия, например «Артистизм»"
                value={newCriterion[nom.id]?.name || ''}
                onChange={e => setNewCriterion(prev => ({ ...prev, [nom.id]: { name: e.target.value, max_score: prev[nom.id]?.max_score || '10' } }))}
                onKeyDown={e => e.key === 'Enter' && handleCreateCriterion(nom.id)}
              />
              <Input
                type="number"
                className="h-8 text-sm w-20"
                placeholder="Баллы"
                value={newCriterion[nom.id]?.max_score ?? '10'}
                onChange={e => setNewCriterion(prev => ({ ...prev, [nom.id]: { name: prev[nom.id]?.name || '', max_score: e.target.value } }))}
              />
              <Button size="sm" onClick={() => handleCreateCriterion(nom.id)}>
                <Icon name="Plus" size={14} />
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default NominationsCard;