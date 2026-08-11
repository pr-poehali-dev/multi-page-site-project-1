import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { Application, CustomFieldDef } from './applicationTypes';
import { isValidVkLink, VK_LINK_ERROR_MESSAGE } from '@/lib/vkValidation';

export interface ApplicationEditPayload {
  application_id: number;
  full_name: string;
  contact_position: string;
  email: string;
  phone: string;
  vk_link: string;
  city: string;
  category: string;
  performance_title: string;
  participation_format: string;
  nomination: string;
  nomination_id: number | null;
  experience: string;
  achievements: string;
  additional_info: string;
  custom_fields: Record<string, string>;
}

interface ApplicationEditFormProps {
  app: Application;
  fieldDefsByContest: Record<number, CustomFieldDef[]>;
  saving: boolean;
  onSave: (payload: ApplicationEditPayload) => void;
  onCancel: () => void;
}

const ApplicationEditForm = ({ app, fieldDefsByContest, saving, onSave, onCancel }: ApplicationEditFormProps) => {
  const [form, setForm] = useState({
    full_name: app.full_name || '',
    contact_position: app.contact_position || '',
    email: app.email || '',
    phone: app.phone || '',
    vk_link: app.vk_link || '',
    city: app.city || '',
    category: app.category || '',
    performance_title: app.performance_title || '',
    participation_format: app.participation_format || '',
    nomination: app.nomination || '',
    experience: app.experience || '',
    achievements: app.achievements || '',
    additional_info: app.additional_info || '',
  });
  const [customFields, setCustomFields] = useState<Record<string, string>>({ ...(app.custom_fields || {}) });

  const defs = fieldDefsByContest[app.contest_id] || [];
  const customFieldKeys = Object.keys(app.custom_fields || {});

  const [vkTouched, setVkTouched] = useState(false);
  const vkError = vkTouched && form.vk_link && !isValidVkLink(form.vk_link);

  const setField = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const setCustomField = (key: string, value: string) => {
    setCustomFields(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (form.vk_link && !isValidVkLink(form.vk_link)) {
      setVkTouched(true);
      return;
    }
    onSave({
      application_id: app.id,
      ...form,
      nomination_id: app.nomination_id ?? null,
      custom_fields: customFields,
    });
  };

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">ФИО участника</Label>
          <Input value={form.full_name} onChange={e => setField('full_name', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Должность / контактное лицо</Label>
          <Input value={form.contact_position} onChange={e => setField('contact_position', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Email</Label>
          <Input value={form.email} onChange={e => setField('email', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Телефон</Label>
          <Input value={form.phone} onChange={e => setField('phone', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Город</Label>
          <Input value={form.city} onChange={e => setField('city', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Ссылка ВК</Label>
          <Input
            value={form.vk_link}
            onChange={e => setField('vk_link', e.target.value)}
            onBlur={() => setVkTouched(true)}
            className={vkError ? 'border-destructive' : ''}
          />
          {vkError && <p className="text-xs text-destructive">{VK_LINK_ERROR_MESSAGE}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Категория</Label>
          <Input value={form.category} onChange={e => setField('category', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Название номера / работы</Label>
          <Input value={form.performance_title} onChange={e => setField('performance_title', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Номинация</Label>
          <Input value={form.nomination} onChange={e => setField('nomination', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Формат участия</Label>
          <Input value={form.participation_format} onChange={e => setField('participation_format', e.target.value)} placeholder="offline / online" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Опыт</Label>
          <Input value={form.experience} onChange={e => setField('experience', e.target.value)} />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Достижения</Label>
        <Textarea value={form.achievements} onChange={e => setField('achievements', e.target.value)} rows={3} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Дополнительная информация</Label>
        <Textarea value={form.additional_info} onChange={e => setField('additional_info', e.target.value)} rows={3} />
      </div>

      {customFieldKeys.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Ответы на дополнительные вопросы:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/30 rounded-lg p-3">
            {customFieldKeys.map(key => {
              const def = defs.find(d => d.field_name === key);
              const label = def?.field_label || key;
              const isCheckbox = def?.field_type === 'checkbox';
              return (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  {isCheckbox ? (
                    <div className="flex items-center gap-2 h-9">
                      <Checkbox
                        checked={customFields[key] === 'true'}
                        onCheckedChange={checked => setCustomField(key, checked ? 'true' : 'false')}
                      />
                    </div>
                  ) : (
                    <Input value={customFields[key] || ''} onChange={e => setCustomField(key, e.target.value)} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Icon name="Loader" size={14} className="mr-1.5 animate-spin" /> : <Icon name="Check" size={14} className="mr-1.5" />}
          Сохранить
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>
          Отмена
        </Button>
      </div>
    </div>
  );
};

export default ApplicationEditForm;