import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { DiplomaTemplateField, DiplomaFont, DIPLOMA_DATA_FIELDS, FONT_OPTIONS } from '@/types/diploma';

interface DiplomaFieldPanelProps {
  field: DiplomaTemplateField;
  customFonts: DiplomaFont[];
  onChange: (updates: Partial<DiplomaTemplateField>) => void;
  onRemove: () => void;
  onClose: () => void;
  onUngroup?: () => void;
}

const ALIGN_OPTIONS: { value: DiplomaTemplateField['text_align']; icon: string; label: string }[] = [
  { value: 'left', icon: 'AlignLeft', label: 'Слева' },
  { value: 'center', icon: 'AlignCenter', label: 'По центру' },
  { value: 'right', icon: 'AlignRight', label: 'Справа' },
  { value: 'justify', icon: 'AlignJustify', label: 'По ширине' },
];

const DiplomaFieldPanel = ({ field, customFonts, onChange, onRemove, onClose, onUngroup }: DiplomaFieldPanelProps) => {
  const allFonts = [...FONT_OPTIONS, ...customFonts.map(f => f.name)];

  return (
    <div className="w-72 shrink-0 border-l bg-background p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Настройки поля</h4>
        <Button variant="ghost" size="sm" onClick={onClose}><Icon name="X" size={14} /></Button>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Источник данных</label>
        <Select value={field.data_key} onValueChange={v => onChange({ data_key: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {DIPLOMA_DATA_FIELDS.map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {field.data_key !== 'custom' && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Константа перед значением</label>
          <Input
            value={field.prefix_text || ''}
            onChange={e => onChange({ prefix_text: e.target.value })}
            placeholder="например: Номинация"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Будет напечатано слитно с подставляемым значением, например «Номинация Вокал», и центрировано как единый текст.
          </p>
        </div>
      )}

      {field.data_key === 'custom' && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Текст</label>
          <Textarea value={field.custom_text} onChange={e => onChange({ custom_text: e.target.value })} rows={3} placeholder="Введите текст" />
        </div>
      )}

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Шрифт</label>
        <Select value={field.font_family} onValueChange={v => onChange({ font_family: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {allFonts.map(f => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Размер, пт{field.auto_fit !== false ? ' (макс.)' : ''}</label>
          <Input type="number" min={6} max={200} value={field.font_size} onChange={e => onChange({ font_size: Number(e.target.value) })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Межстрочный</label>
          <Input type="number" step={0.1} min={0.5} max={4} value={field.line_height} onChange={e => onChange({ line_height: Number(e.target.value) })} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={field.auto_fit !== false}
          onChange={e => onChange({ auto_fit: e.target.checked })}
          className="w-3.5 h-3.5"
        />
        Уменьшать шрифт, чтобы текст помещался в поле
      </label>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Цвет текста</label>
        <div className="flex gap-2 items-center">
          <input type="color" value={field.font_color} onChange={e => onChange({ font_color: e.target.value })} className="w-10 h-9 rounded border cursor-pointer" />
          <Input value={field.font_color} onChange={e => onChange({ font_color: e.target.value })} className="flex-1" />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Жирность</label>
        <Select value={field.font_weight} onValueChange={v => onChange({ font_weight: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Обычный</SelectItem>
            <SelectItem value="500">Средний</SelectItem>
            <SelectItem value="600">Полужирный</SelectItem>
            <SelectItem value="bold">Жирный</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Выравнивание</label>
        <div className="flex gap-1">
          {ALIGN_OPTIONS.map(opt => (
            <Button
              key={opt.value}
              type="button"
              size="sm"
              variant={field.text_align === opt.value ? 'default' : 'outline'}
              className="flex-1 px-0"
              title={opt.label}
              onClick={() => onChange({ text_align: opt.value })}
            >
              <Icon name={opt.icon} size={14} />
            </Button>
          ))}
        </div>
      </div>

      {field.group_id != null && onUngroup && (
        <Button variant="outline" className="w-full" onClick={onUngroup}>
          <Icon name="Ungroup" fallback="Group" size={14} className="mr-2" /> Разгруппировать
        </Button>
      )}

      <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={onRemove}>
        <Icon name="Trash2" size={14} className="mr-2" /> Удалить поле
      </Button>
    </div>
  );
};

export default DiplomaFieldPanel;