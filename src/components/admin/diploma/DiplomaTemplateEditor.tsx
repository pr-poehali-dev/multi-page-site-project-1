import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useDiplomaTemplates } from '@/hooks/useDiplomaTemplates';
import { loadCustomFonts } from '@/lib/loadCustomFonts';
import { DiplomaTemplate, DiplomaTemplateField } from '@/types/diploma';
import DiplomaTemplateCanvas from './DiplomaTemplateCanvas';
import DiplomaFieldPanel from './DiplomaFieldPanel';
import DiplomaFontsManager from './DiplomaFontsManager';

interface DiplomaTemplateEditorProps {
  templateId: number;
  onBack: () => void;
}

const emptyField = (): DiplomaTemplateField => ({
  data_key: 'custom',
  custom_text: 'Новый текст',
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
});

const DiplomaTemplateEditor = ({ templateId, onBack }: DiplomaTemplateEditorProps) => {
  const { loadTemplate, updateTemplate, uploadBackground, saveFields, fonts, uploadFont, deleteFont } = useDiplomaTemplates();
  const [template, setTemplate] = useState<DiplomaTemplate | null>(null);
  const [fields, setFields] = useState<DiplomaTemplateField[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [showFontsManager, setShowFontsManager] = useState(false);
  const [, setFontsVersion] = useState(0);

  const load = useCallback(async () => {
    const data = await loadTemplate(templateId);
    if (data) {
      setTemplate(data.template);
      setFields(data.fields);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCustomFonts(fonts).then(() => setFontsVersion(v => v + 1)); }, [fonts]);

  const addField = () => {
    setFields(prev => [...prev, emptyField()]);
    setSelectedIndex(fields.length);
  };

  const updateField = (index: number, updates: Partial<DiplomaTemplateField>) => {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
    setSelectedIndex(null);
  };

  const handleUploadBackground = async (file: File) => {
    if (!template) return;
    setUploadingBg(true);
    const url = await uploadBackground(template.id, file);
    if (url) setTemplate(prev => prev ? { ...prev, background_url: url } : prev);
    setUploadingBg(false);
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

  const selectedField = selectedIndex !== null ? fields[selectedIndex] : null;

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

        <label>
          <Button variant="outline" asChild disabled={uploadingBg}>
            <span className="cursor-pointer">
              <Icon name={uploadingBg ? 'Loader' : 'Image'} size={16} className={`mr-2 ${uploadingBg ? 'animate-spin' : ''}`} />
              Загрузить подложку
            </span>
          </Button>
          <input type="file" accept="image/*" className="hidden" onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleUploadBackground(file);
            e.target.value = '';
          }} />
        </label>

        <Button variant="outline" onClick={addField}>
          <Icon name="Plus" size={16} className="mr-2" /> Добавить текст
        </Button>

        <Button variant="outline" onClick={() => setShowFontsManager(true)}>
          <Icon name="Type" size={16} className="mr-2" /> Шрифты
        </Button>

        <Button onClick={handleSave} disabled={saving} className="ml-auto">
          {saving ? <Icon name="Loader" size={16} className="mr-2 animate-spin" /> : <Icon name="Save" size={16} className="mr-2" />}
          Сохранить
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 overflow-auto bg-muted/40 rounded-lg p-6" style={{ maxHeight: '75vh' }}>
          <DiplomaTemplateCanvas
            orientation={template.orientation}
            backgroundUrl={template.background_url}
            fields={fields}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            onUpdateField={updateField}
          />
        </div>

        {selectedField && (
          <DiplomaFieldPanel
            field={selectedField}
            customFonts={fonts}
            onChange={updates => updateField(selectedIndex!, updates)}
            onRemove={() => removeField(selectedIndex!)}
            onClose={() => setSelectedIndex(null)}
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