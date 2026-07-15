import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { Category } from '@/hooks/useShopAdmin';

interface ShopCategoriesViewProps {
  categories: Category[];
  catsLoading: boolean;
  editingCat: Category | null;
  setEditingCat: (cat: Category | null) => void;
  newCatName: string;
  setNewCatName: (name: string) => void;
  savingCat: boolean;
  onCreateCategory: () => void;
  onSaveCategory: (cat: Category, name: string) => void;
  onDeleteCategory: (cat: Category) => void;
  onToggleCategoryActive: (cat: Category) => void;
}

const ShopCategoriesView = ({
  categories,
  catsLoading,
  editingCat,
  setEditingCat,
  newCatName,
  setNewCatName,
  savingCat,
  onCreateCategory,
  onSaveCategory,
  onDeleteCategory,
  onToggleCategoryActive,
}: ShopCategoriesViewProps) => {
  return (
    <div className="max-w-xl">
      <p className="text-sm text-muted-foreground mb-4">Разделы отображаются на странице магазина в виде раскрывающегося списка. Переключателем можно скрыть раздел с товарами от посетителей, не удаляя его.</p>
      {catsLoading ? (
        <div className="text-center py-10"><Icon name="Loader" size={28} className="mx-auto animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2 mb-6">
          {categories.map(cat => (
            <Card key={cat.id} className="p-3 flex items-center gap-3">
              {editingCat?.id === cat.id ? (
                <>
                  <Input autoFocus value={editingCat.name} onChange={e => setEditingCat({ ...editingCat, name: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') onSaveCategory(cat, editingCat.name); if (e.key === 'Escape') setEditingCat(null); }}
                    className="flex-1 h-8" />
                  <Button size="sm" onClick={() => onSaveCategory(cat, editingCat.name)} disabled={savingCat}>
                    <Icon name="Check" size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingCat(null)}>
                    <Icon name="X" size={14} />
                  </Button>
                </>
              ) : (
                <>
                  <Icon name="GripVertical" size={16} className="text-muted-foreground/40 shrink-0" />
                  <span className={`flex-1 font-medium ${cat.is_active === false ? 'text-muted-foreground' : ''}`}>
                    {cat.name}
                    {cat.is_active === false && <span className="ml-2 text-xs font-normal text-muted-foreground">(скрыт)</span>}
                  </span>
                  <Switch
                    checked={cat.is_active !== false}
                    onCheckedChange={() => onToggleCategoryActive(cat)}
                    title={cat.is_active === false ? 'Показать раздел на витрине' : 'Скрыть раздел с витрины'}
                  />
                  <Button size="sm" variant="ghost" onClick={() => setEditingCat({ ...cat })}>
                    <Icon name="Pencil" size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDeleteCategory(cat)}>
                    <Icon name="Trash2" size={14} />
                  </Button>
                </>
              )}
            </Card>
          ))}
          {categories.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">Разделов пока нет</p>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Название нового раздела"
          onKeyDown={e => e.key === 'Enter' && onCreateCategory()} />
        <Button onClick={onCreateCategory} disabled={savingCat || !newCatName.trim()}>
          {savingCat ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Plus" size={16} />}
        </Button>
      </div>
    </div>
  );
};

export default ShopCategoriesView;
