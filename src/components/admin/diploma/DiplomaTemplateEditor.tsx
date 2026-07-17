import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useDiplomaTemplates } from '@/hooks/useDiplomaTemplates';
import { useToast } from '@/hooks/use-toast';
import { loadCustomFonts } from '@/lib/loadCustomFonts';
import { DiplomaTemplate, DiplomaTemplateField, DiplomaGuide, MM_TO_PX, A4_WIDTH_MM, A4_HEIGHT_MM } from '@/types/diploma';
import DiplomaTemplateCanvas from './DiplomaTemplateCanvas';
import DiplomaFieldPanel from './DiplomaFieldPanel';
import DiplomaFontsManager from './DiplomaFontsManager';
import DiplomaRulers from './DiplomaRulers';

interface DiplomaTemplateEditorProps {
  templateId: number;
  onBack: () => void;
}

const MAX_BACKGROUND_SIZE = 100 * 1024 * 1024; // 100 МБ — исходный файл до сжатия на клиенте

const emptyField = (): DiplomaTemplateField => ({
  data_key: 'custom',
  custom_text: 'Новый текст',
  prefix_text: '',
  pos_x: 30,
  pos_y: 40,
  width: 40,
  height: 10,
  font_family: 'Montserrat',
  font_size: 18,
  font_color: '#000000',
  font_weight: 'normal',
  line_height: 1.2,
  text_align: 'center',
  auto_fit: true,
});

const DiplomaTemplateEditor = ({ templateId, onBack }: DiplomaTemplateEditorProps) => {
  const { toast } = useToast();
  const { loadTemplate, updateTemplate, uploadBackground, deleteBackground, saveFields, fonts, uploadFont, deleteFont } = useDiplomaTemplates();
  const [template, setTemplate] = useState<DiplomaTemplate | null>(null);
  const [fields, setFields] = useState<DiplomaTemplateField[]>([]);
  const [guides, setGuides] = useState<DiplomaGuide[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [showFontsManager, setShowFontsManager] = useState(false);
  const [, setFontsVersion] = useState(0);

  const load = useCallback(async () => {
    const data = await loadTemplate(templateId);
    if (data) {
      setTemplate(data.template);
      setFields(data.fields);
      setGuides(data.template.guides || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCustomFonts(fonts).then(() => setFontsVersion(v => v + 1)); }, [fonts]);

  const addField = () => {
    setFields(prev => [...prev, emptyField()]);
    setSelectedIndices([fields.length]);
  };

  const updateField = (index: number, updates: Partial<DiplomaTemplateField>) => {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
    setSelectedIndices([]);
  };

  const nextGroupId = () => fields.reduce((max, f) => (f.group_id != null && f.group_id > max ? f.group_id : max), 0) + 1;

  const handleMergeFields = () => {
    if (selectedIndices.length < 2) return;
    const gid = nextGroupId();
    setFields(prev => prev.map((f, i) => (selectedIndices.includes(i) ? { ...f, group_id: gid } : f)));
  };

  const handleUngroupSelected = () => {
    if (selectedIndices.length === 0) return;
    const idx = selectedIndices[0];
    const gid = fields[idx]?.group_id;
    if (gid == null) return;
    setFields(prev => prev.map(f => (f.group_id === gid ? { ...f, group_id: null } : f)));
  };

  const handleUploadBackground = async (file: File) => {
    if (!template) return;
    if (file.size > MAX_BACKGROUND_SIZE) {
      toast({ title: 'Файл слишком большой', description: `Максимальный размер файла — 100 МБ. Ваш файл: ${(file.size / 1024 / 1024).toFixed(1)} МБ`, variant: 'destructive' });
      return;
    }
    setUploadingBg(true);
    const url = await uploadBackground(template.id, file);
    if (url) setTemplate(prev => prev ? { ...prev, background_url: url } : prev);
    setUploadingBg(false);
  };

  const handleRemoveBackground = async () => {
    if (!template || !template.background_url) return;
    if (!confirm('Удалить подложку?')) return;
    const ok = await deleteBackground(template.id);
    if (ok) setTemplate(prev => prev ? { ...prev, background_url: '' } : prev);
  };

  const handleOrientationChange = (orientation: string) => {
    if (!template) return;
    setTemplate(prev => prev ? { ...prev, orientation: orientation as DiplomaTemplate['orientation'] } : prev);
    updateTemplate(template.id, { orientation });
  };

  const handleNameChange = (name: string) => {
    if (!template) return;
    setTemplate(prev => prev ? { ...prev, name } : prev);
  };

  const handleNameBlur = () => {
    if (!template) return;
    updateTemplate(template.id, { name: template.name });
  };

  const handleGuidesChange = (next: DiplomaGuide[]) => {
    setGuides(next);
    if (template) updateTemplate(template.id, { guides: next });
  };

  const addGuide = (orientation: 'h' | 'v', pos: number) => {
    const guide: DiplomaGuide = { id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, orientation, pos };
    handleGuidesChange([...guides, guide]);
  };

  const handleSave = async () => {
    if (!template) return;
    setSaving(true);
    const saved = await saveFields(template.id, fields);
    if (saved) setFields(saved);
    setSaving(false);
  };

  if (!template) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Icon name="Loader" size={32} className="mx-auto mb-3 animate-spin" />
        Загрузка шаблона...
      </div>
    );
  }

  const selectedField = selectedIndices.length === 1 ? fields[selectedIndices[0]] : null;

  const widthMm = template.orientation === 'portrait' ? A4_WIDTH_MM : A4_HEIGHT_MM;
  const heightMm = template.orientation === 'portrait' ? A4_HEIGHT_MM : A4_WIDTH_MM;
  const pageWidthPx = widthMm * MM_TO_PX;
  const pageHeightPx = heightMm * MM_TO_PX;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Button variant="outline" onClick={onBack}>
          <Icon name="ArrowLeft" size={16} className="mr-2" /> Назад
        </Button>
        <Input value={template.name} onChange={e => handleNameChange(e.target.value)} onBlur={handleNameBlur} className="max-w-xs" />

        <Select value={template.orientation} onValueChange={handleOrientationChange}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="portrait">Книжная</SelectItem>
            <SelectItem value="landscape">Альбомная</SelectItem>
          </SelectContent>
        </Select>

        <label title="Изображение автоматически сожмётся перед загрузкой">
          <Button variant="outline" asChild disabled={uploadingBg}>
            <span className="cursor-pointer">
              <Icon name={uploadingBg ? 'Loader' : 'Image'} size={16} className={`mr-2 ${uploadingBg ? 'animate-spin' : ''}`} />
              {template.background_url ? 'Заменить подложку' : 'Загрузить подложку'}
            </span>
          </Button>
          <input type="file" accept="image/*" className="hidden" onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleUploadBackground(file);
            e.target.value = '';
          }} />
        </label>

        {template.background_url && (
          <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleRemoveBackground}>
            <Icon name="ImageOff" size={16} className="mr-2" /> Удалить подложку
          </Button>
        )}

        <Button variant="outline" onClick={addField}>
          <Icon name="Plus" size={16} className="mr-2" /> Добавить текст
        </Button>

        {selectedIndices.length > 1 && (
          <Button variant="outline" onClick={handleMergeFields}>
            <Icon name="Group" size={16} className="mr-2" /> Объединить ({selectedIndices.length})
          </Button>
        )}

        <Button variant="outline" onClick={() => setShowFontsManager(true)}>
          <Icon name="Type" size={16} className="mr-2" /> Шрифты
        </Button>

        <Button onClick={handleSave} disabled={saving} className="ml-auto">
          {saving ? <Icon name="Loader" size={16} className="mr-2 animate-spin" /> : <Icon name="Save" size={16} className="mr-2" />}
          Сохранить
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        Клик по линейке сверху/слева — добавить направляющую. Двойной клик по направляющей — удалить. Shift/Ctrl + клик по полям — выбрать несколько для объединения. Объединённые поля автоматически выстраиваются в строку по своему тексту и центрируются.
      </p>

      <div className="flex gap-4">
        <div className="flex-1 overflow-auto bg-muted/40 rounded-lg p-6" style={{ maxHeight: '75vh' }}>
          <DiplomaRulers pageWidthPx={pageWidthPx} pageHeightPx={pageHeightPx} onAddGuide={addGuide}>
            <DiplomaTemplateCanvas
              orientation={template.orientation}
              backgroundUrl={template.background_url}
              fields={fields}
              selectedIndices={selectedIndices}
              onSelect={setSelectedIndices}
              onUpdateField={updateField}
              guides={guides}
              onGuidesChange={handleGuidesChange}
            />
          </DiplomaRulers>
        </div>

        {selectedField && (
          <DiplomaFieldPanel
            field={selectedField}
            customFonts={fonts}
            onChange={updates => updateField(selectedIndices[0], updates)}
            onRemove={() => removeField(selectedIndices[0])}
            onClose={() => setSelectedIndices([])}
            onUngroup={handleUngroupSelected}
          />
        )}
      </div>

      {showFontsManager && (
        <DiplomaFontsManager
          fonts={fonts}
          onUpload={uploadFont}
          onDelete={deleteFont}
          onClose={() => setShowFontsManager(false)}
        />
      )}
    </div>
  );
};

export default DiplomaTemplateEditor;