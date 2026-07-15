import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

type View = 'categories' | 'products' | 'orders' | 'archive';

interface ShopTabHeaderProps {
  view: View;
  onChangeView: (view: View) => void;
  activeOrdersCount: number;
}

const ShopTabHeader = ({ view, onChangeView, activeOrdersCount }: ShopTabHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
      <h2 className="text-2xl font-heading font-bold">Интернет-магазин</h2>
      <div className="flex gap-2 flex-wrap">
        <Button variant={view === 'categories' ? 'default' : 'outline'} onClick={() => onChangeView('categories')}>
          <Icon name="FolderOpen" size={16} className="mr-2" /> Разделы
        </Button>
        <Button variant={view === 'products' ? 'default' : 'outline'} onClick={() => onChangeView('products')}>
          <Icon name="ShoppingBag" size={16} className="mr-2" /> Товары
        </Button>
        <Button variant={view === 'orders' ? 'default' : 'outline'} onClick={() => onChangeView('orders')}>
          <Icon name="ClipboardList" size={16} className="mr-2" /> Заказы
          {activeOrdersCount > 0 && <span className="ml-1 bg-primary-foreground text-primary rounded-full text-xs px-1.5">{activeOrdersCount}</span>}
        </Button>
        <Button variant={view === 'archive' ? 'default' : 'outline'} onClick={() => onChangeView('archive')}>
          <Icon name="Archive" size={16} className="mr-2" /> Архив
        </Button>
      </div>
    </div>
  );
};

export default ShopTabHeader;
