import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface Category { id: number; name: string; sort_order: number; }

interface Order {
  id: number;
  product_name: string;
  price: number;
  status: string;
  created_at: string;
  form_data: Record<string, string>;
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Новый', paid: 'Оплачен', cancelled: 'Отменён', completed: 'Выполнен',
};

interface ShopOrdersViewProps {
  view: 'orders' | 'archive';
  orders: Order[];
  categories: Category[];
  selectedCatId: string;
  ordersLoading: boolean;
  onSelectCategory: (v: string) => void;
  onUpdateOrderStatus: (orderId: number, status: string) => void;
  onDeleteOrder: (orderId: number) => void;
  onExportToExcel: (list: Order[], filename: string) => void;
}

const ShopOrdersView = ({
  view,
  orders,
  categories,
  selectedCatId,
  ordersLoading,
  onSelectCategory,
  onUpdateOrderStatus,
  onDeleteOrder,
  onExportToExcel,
}: ShopOrdersViewProps) => {
  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const archiveOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');
  const list = view === 'orders' ? activeOrders : archiveOrders;
  const emptyLabel = view === 'orders' ? 'Активных заказов нет' : 'Архив пуст';
  const exportName = view === 'orders' ? 'заказы_активные' : 'заказы_архив';

  return (
    <>
      <div className="flex items-end gap-4 mb-6 flex-wrap">
        <div className="max-w-xs flex-1">
          <label className="text-sm font-medium mb-1 block">Раздел</label>
          <Select value={selectedCatId || 'all'} onValueChange={v => onSelectCategory(v === 'all' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Все разделы" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все разделы</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {ordersLoading ? (
        <div className="text-center py-12"><Icon name="Loader" size={32} className="mx-auto animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={() => onExportToExcel(list, exportName)}>
              <Icon name="Download" size={15} className="mr-2" /> Экспорт в Excel
            </Button>
          </div>
          {list.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name={view === 'orders' ? 'ClipboardList' : 'Archive'} size={48} className="mx-auto mb-3 opacity-30" />
              <p>{emptyLabel}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {list.map(o => (
                <Card key={o.id} className={`p-4 ${view === 'archive' ? 'opacity-75' : ''}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-muted-foreground">#{o.id}</span>
                        <span className="font-medium">{o.product_name}</span>
                        <span className="font-bold text-secondary">{Number(o.price).toLocaleString('ru-RU')} ₽</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          o.status === 'new' ? 'bg-blue-100 text-blue-700' :
                          o.status === 'paid' ? 'bg-green-100 text-green-700' :
                          o.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                          'bg-red-100 text-red-600'}`}>
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{new Date(o.created_at).toLocaleString('ru-RU')}</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                        {Object.entries(o.form_data || {}).map(([k, v]) => (
                          <p key={k} className="text-sm"><span className="text-muted-foreground">{k}:</span> {v}</p>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={o.status} onValueChange={v => onUpdateOrderStatus(o.id, v)}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive shrink-0" onClick={() => onDeleteOrder(o.id)}>
                        <Icon name="Trash2" size={15} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default ShopOrdersView;
