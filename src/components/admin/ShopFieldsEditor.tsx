import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface FormField {
  id?: number;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  sort_order: number;
}

interface Product {
  id: number;
  category_id: number | null;
  name: string;
  description: string;
  price: number;
  photo_url: string;
  payment_url: string;
  is_active: boolean;
  sort_order: number;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Текст' },
  { value: 'number', label: 'Число' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Телефон' },
  { value: 'textarea', label: 'Многострочный текст' },
  { value: 'select', label: 'Список' },
  { value: 'date', label: 'Дата' },
];

interface ShopFieldsEditorProps {
  fieldsProduct: Product;
  fields: FormField[];
  allFields: FormField[];
  savingFields: boolean;
  showFieldPicker: boolean;
  onBack: () => void;
  onAddField: () => void;
  onAddFieldFromTemplate: (f: FormField) => void;
  onUpdateField: (i: number, key: keyof FormField, val: string | boolean | number) => void;
  onRemoveField: (i: number) => void;
  onSaveFields: () => void;
  onToggleFieldPicker: () => void;
}

const ShopFieldsEditor = ({
  fieldsProduct,
  fields,
  allFields,
  savingFields,
  showFieldPicker,
  onBack,
  onAddField,
  onAddFieldFromTemplate,
  onUpdateField,
  onRemoveField,
  onSaveFields,
  onToggleFieldPicker,
}: ShopFieldsEditorProps) => (
  <div>
    <div className="flex items-center gap-3 mb-6">
      <Button variant="outline" onClick={onBack}>
        <Icon name="ArrowLeft" size={16} className="mr-2" /> Назад
      </Button>
      <h2 className="text-xl font-semibold">Поля формы: {fieldsProduct.name}</h2>
    </div>
    <Card className="p-5 mb-4">
      <div className="space-y-3">
        {fields.filter(f => f.field_name !== '__deleted__').map((f, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center border rounded-lg p-3">
            <div className="col-span-3">
              <label className="text-xs text-muted-foreground mb-1 block">Название поля</label>
              <Input value={f.field_label} onChange={e => onUpdateField(i, 'field_label', e.target.value)} placeholder="Например: Имя" />
            </div>
            <div className="col-span-3">
              <label className="text-xs text-muted-foreground mb-1 block">Тип</label>
              <Select value={f.field_type} onValueChange={v => onUpdateField(i, 'field_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-4">
              <label className="text-xs text-muted-foreground mb-1 block">Системное имя</label>
              <Input value={f.field_name} onChange={e => onUpdateField(i, 'field_name', e.target.value)} placeholder="field_name" />
            </div>
            <div className="col-span-1 flex flex-col items-center gap-1">
              <label className="text-xs text-muted-foreground">Обяз.</label>
              <input type="checkbox" checked={f.is_required} onChange={e => onUpdateField(i, 'is_required', e.target.checked)} className="w-4 h-4 cursor-pointer" />
            </div>
            <div className="col-span-1 flex items-end justify-center">
              <Button variant="ghost" size="sm" onClick={() => onRemoveField(i)} className="text-destructive hover:text-destructive">
                <Icon name="Trash2" size={14} />
              </Button>
            </div>
          </div>
        ))}
        {fields.length === 0 && <p className="text-muted-foreground text-center py-6">Нет полей. Добавьте первое поле.</p>}
      </div>
    </Card>
    <div className="flex gap-2 flex-wrap">
      <Button variant="outline" onClick={onAddField}><Icon name="Plus" size={16} className="mr-2" /> Новое поле</Button>
      {allFields.length > 0 && (
        <Button variant="outline" onClick={onToggleFieldPicker}>
          <Icon name="Library" size={16} className="mr-2" /> Из существующих
        </Button>
      )}
      <Button onClick={onSaveFields} disabled={savingFields}>
        {savingFields ? <Icon name="Loader" size={16} className="mr-2 animate-spin" /> : <Icon name="Save" size={16} className="mr-2" />}
        Сохранить поля
      </Button>
    </div>
    {showFieldPicker && (
      <Card className="p-4 mt-3 border-dashed">
        <p className="text-sm font-medium mb-3 text-muted-foreground">Выберите поле для добавления:</p>
        <div className="flex flex-wrap gap-2">
          {allFields.map((f, i) => {
            const alreadyAdded = fields.some(x => x.field_label === f.field_label);
            return (
              <button
                key={i}
                disabled={alreadyAdded}
                onClick={() => onAddFieldFromTemplate(f)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${alreadyAdded ? 'opacity-40 cursor-not-allowed bg-muted' : 'hover:bg-accent cursor-pointer'}`}
              >
                <span className="font-medium">{f.field_label}</span>
                <span className="text-muted-foreground ml-1.5 text-xs">{FIELD_TYPES.find(t => t.value === f.field_type)?.label}</span>
                {f.is_required && <span className="text-red-500 ml-1 text-xs">*</span>}
              </button>
            );
          })}
        </div>
      </Card>
    )}
  </div>
);

export default ShopFieldsEditor;
