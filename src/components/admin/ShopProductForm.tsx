import { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface Category { id: number; name: string; sort_order: number; }

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

interface ShopProductFormProps {
  editingProduct: Product | null;
  form: Omit<Product, 'id'>;
  categories: Category[];
  savingProduct: boolean;
  uploadingPhoto: boolean;
  onBack: () => void;
  onFormChange: (updater: (f: Omit<Product, 'id'>) => Omit<Product, 'id'>) => void;
  onSave: () => void;
  onUploadPhoto: (file: File, productId: number) => void;
  onOpenFieldsEditor: (p: Product) => void;
}

const ShopProductForm = ({
  editingProduct,
  form,
  categories,
  savingProduct,
  uploadingPhoto,
  onBack,
  onFormChange,
  onSave,
  onUploadPhoto,
  onOpenFieldsEditor,
}: ShopProductFormProps) => {
  const photoInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" onClick={onBack}>
          <Icon name="ArrowLeft" size={16} className="mr-2" /> Назад
        </Button>
        <h2 className="text-xl font-semibold">{editingProduct ? 'Редактировать товар' : 'Новый товар'}</h2>
      </div>
      <Card className="p-6 space-y-4 max-w-2xl">
        <div>
          <label className="text-sm font-medium mb-1 block">Название товара *</label>
          <Input value={form.name} onChange={e => onFormChange(f => ({ ...f, name: e.target.value }))} placeholder="Название" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Раздел</label>
          <Select value={String(form.category_id ?? 'none')} onValueChange={v => onFormChange(f => ({ ...f, category_id: v === 'none' ? null : Number(v) }))}>
            <SelectTrigger><SelectValue placeholder="Без раздела" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без раздела</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Описание</label>
          <textarea value={form.description} onChange={e => onFormChange(f => ({ ...f, description: e.target.value }))}
            placeholder="Описание товара..." className="w-full border rounded-md px-3 py-2 text-sm resize-none h-24 bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Цена (руб.)</label>
            <Input type="number" value={form.price} onChange={e => onFormChange(f => ({ ...f, price: Number(e.target.value) }))} placeholder="0" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Порядок сортировки</label>
            <Input type="number" value={form.sort_order} onChange={e => onFormChange(f => ({ ...f, sort_order: Number(e.target.value) }))} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Ссылка на оплату</label>
          <Input value={form.payment_url} onChange={e => onFormChange(f => ({ ...f, payment_url: e.target.value }))} placeholder="https://..." />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => onFormChange(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 cursor-pointer" />
          <label htmlFor="is_active" className="text-sm cursor-pointer">Активен (отображается в магазине)</label>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Фото товара</label>
          {form.photo_url && <img src={form.photo_url} alt="Фото" className="w-32 h-32 object-cover rounded-lg border mb-2" />}
          {editingProduct ? (
            <>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const file = e.target.files?.[0]; if (file && editingProduct) onUploadPhoto(file, editingProduct.id); }} />
              <Button variant="outline" size="sm" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}>
                {uploadingPhoto ? <Icon name="Loader" size={14} className="mr-2 animate-spin" /> : <Icon name="Upload" size={14} className="mr-2" />}
                {form.photo_url ? 'Заменить фото' : 'Загрузить фото'}
              </Button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Сначала создайте товар, затем загрузите фото</p>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={onSave} disabled={savingProduct}>
            {savingProduct ? <Icon name="Loader" size={16} className="mr-2 animate-spin" /> : <Icon name="Save" size={16} className="mr-2" />}
            {editingProduct ? 'Сохранить' : 'Создать'}
          </Button>
          {editingProduct && (
            <Button variant="outline" onClick={() => { onBack(); onOpenFieldsEditor(editingProduct); }}>
              <Icon name="ListChecks" size={16} className="mr-2" /> Настроить форму заявки
            </Button>
          )}
          <Button variant="ghost" onClick={onBack}>Отмена</Button>
        </div>
      </Card>
    </div>
  );
};

export default ShopProductForm;
