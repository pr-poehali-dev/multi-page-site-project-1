import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

interface ShopProductsViewProps {
  products: Product[];
  categories: Category[];
  selectedCatId: string;
  productsLoading: boolean;
  onSelectCategory: (v: string) => void;
  onOpenCreate: () => void;
  onOpenEdit: (p: Product) => void;
  onOpenFieldsEditor: (p: Product) => void;
  onCopyProduct: (p: Product) => void;
  onDeleteProduct: (p: Product) => void;
}

const ShopProductsView = ({
  products,
  categories,
  selectedCatId,
  productsLoading,
  onSelectCategory,
  onOpenCreate,
  onOpenEdit,
  onOpenFieldsEditor,
  onCopyProduct,
  onDeleteProduct,
}: ShopProductsViewProps) => (
  <>
    <div className="flex items-end gap-4 mb-6 flex-wrap">
      <div className="max-w-xs flex-1">
        <label className="text-sm font-medium mb-1 block">Раздел</label>
        <Select value={selectedCatId || 'all'} onValueChange={v => onSelectCategory(v === 'all' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Все товары" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все товары</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={onOpenCreate}>
        <Icon name="Plus" size={16} className="mr-2" /> Добавить товар
      </Button>
    </div>

    {productsLoading ? (
      <div className="text-center py-12"><Icon name="Loader" size={32} className="mx-auto animate-spin text-muted-foreground" /></div>
    ) : products.length === 0 ? (
      <div className="text-center py-16 text-muted-foreground">
        <Icon name="PackageOpen" size={48} className="mx-auto mb-3 opacity-30" />
        <p>Товаров нет. Добавьте первый товар.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(p => (
          <Card key={p.id} className="overflow-hidden">
            {p.photo_url
              ? <img src={p.photo_url} alt={p.name} className="w-full h-40 object-cover" />
              : <div className="w-full h-40 bg-muted flex items-center justify-center"><Icon name="Image" size={32} className="text-muted-foreground/40" /></div>
            }
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold leading-tight">{p.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                  {p.is_active ? 'Активен' : 'Скрыт'}
                </span>
              </div>
              {p.description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{p.description}</p>}
              <p className="font-bold text-lg mb-3">{p.price.toLocaleString('ru-RU')} ₽</p>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => onOpenEdit(p)}><Icon name="Pencil" size={13} className="mr-1" /> Изм.</Button>
                <Button size="sm" variant="outline" onClick={() => onOpenFieldsEditor(p)}><Icon name="ListChecks" size={13} className="mr-1" /> Форма</Button>
                <Button size="sm" variant="outline" onClick={() => onCopyProduct(p)}><Icon name="Copy" size={13} /></Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDeleteProduct(p)}><Icon name="Trash2" size={13} /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )}
  </>
);

export default ShopProductsView;
