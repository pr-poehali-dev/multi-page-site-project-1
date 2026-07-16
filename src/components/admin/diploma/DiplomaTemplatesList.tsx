import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useDiplomaTemplates } from '@/hooks/useDiplomaTemplates';

interface DiplomaTemplatesListProps {
  onOpenEditor: (templateId: number) => void;
}

const DiplomaTemplatesList = ({ onOpenEditor }: DiplomaTemplatesListProps) => {
  const { templates, loading, createTemplate, deleteTemplate } = useDiplomaTemplates();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [templateType, setTemplateType] = useState('diploma');
  const [orientation, setOrientation] = useState('portrait');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const created = await createTemplate(name.trim(), templateType, orientation);
    setCreating(false);
    if (created) {
      setName(''); setShowCreate(false);
      onOpenEditor(created.id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold">Конструктор дипломов</h2>
          <p className="text-sm text-muted-foreground mt-1">Создавайте шаблоны дипломов и благодарностей с подложкой и настраиваемыми полями</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Icon name="Plus" size={16} className="mr-2" /> Новый шаблон
        </Button>
      </div>

      {showCreate && (
        <Card className="p-4 mb-6 space-y-3 max-w-lg">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Название шаблона (например: Диплом Лауреата)" onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          <div className="grid grid-cols-2 gap-3">
            <Select value={templateType} onValueChange={setTemplateType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="diploma">Диплом</SelectItem>
                <SelectItem value="thanks">Благодарность</SelectItem>
              </SelectContent>
            </Select>
            <Select value={orientation} onValueChange={setOrientation}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Книжная</SelectItem>
                <SelectItem value="landscape">Альбомная</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={creating || !name.trim()}>
              {creating ? <Icon name="Loader" size={14} className="mr-2 animate-spin" /> : null}
              Создать и открыть редактор
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="Loader" size={32} className="mx-auto mb-3 animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="FileBadge" size={48} className="mx-auto mb-3 opacity-30" />
          <p>Пока нет ни одного шаблона</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {templates.map(t => (
            <Card key={t.id} className="overflow-hidden flex flex-col group">
              <div
                className="bg-muted flex items-center justify-center cursor-pointer relative overflow-hidden"
                style={{ aspectRatio: t.orientation === 'portrait' ? '210/297' : '297/210' }}
                onClick={() => onOpenEditor(t.id)}
              >
                {t.background_url ? (
                  <img src={t.background_url} alt={t.name} className="w-full h-full object-cover" />
                ) : (
                  <Icon name="FileBadge" size={32} className="text-muted-foreground/30" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Icon name="Pencil" size={22} className="text-white" />
                </div>
              </div>
              <div className="p-3 flex flex-col gap-1">
                <span className="font-medium text-sm truncate">{t.name}</span>
                <span className="text-xs text-muted-foreground">
                  {t.template_type === 'diploma' ? 'Диплом' : 'Благодарность'} · {t.orientation === 'portrait' ? 'книжная' : 'альбомная'} · {t.fields_count ?? 0} полей
                </span>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => onOpenEditor(t.id)}>
                    <Icon name="Pencil" size={13} className="mr-1" /> Открыть
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteTemplate(t.id)}>
                    <Icon name="Trash2" size={13} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiplomaTemplatesList;
