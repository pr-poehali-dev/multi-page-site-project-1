import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

export interface ShopOrder {
  id: number;
  product_id: number;
  product_name: string;
  contest_title?: string;
  price: number;
  status: string;
  created_at: string;
  form_data: Record<string, string>;
}

interface CabinetOrdersTabProps {
  orders: ShopOrder[];
  loading: boolean;
  onGoToShop: () => void;
}

const getOrderStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; className: string }> = {
    new: { label: 'Новый', className: 'bg-blue-500 hover:bg-blue-600' },
    pending: { label: 'Ожидает оплаты', className: 'bg-yellow-500 hover:bg-yellow-600' },
    paid: { label: 'Оплачен', className: 'bg-green-600 hover:bg-green-700' },
    completed: { label: 'Выполнен', className: 'bg-green-600 hover:bg-green-700' },
    cancelled: { label: 'Отменён', className: 'bg-destructive hover:bg-destructive/90' },
  };
  const info = statusMap[status] || { label: status, className: 'bg-muted-foreground' };
  return <Badge className={info.className}>{info.label}</Badge>;
};

const CabinetOrdersTab = ({ orders, loading, onGoToShop }: CabinetOrdersTabProps) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Icon name="Loader2" size={40} className="animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold">Мои заказы</h2>
        <Button onClick={onGoToShop} className="bg-secondary hover:bg-secondary/90 gap-2">
          <Icon name="ShoppingBag" size={16} /> В магазин
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon name="PackageOpen" size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground mb-4">У вас пока нет заказов</p>
            <Button onClick={onGoToShop} className="bg-secondary hover:bg-secondary/90">
              Перейти в магазин
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="mb-2">{order.product_name}</CardTitle>
                    <CardDescription>
                      {order.contest_title && <>{order.contest_title} · </>}
                      Заказано: {new Date(order.created_at).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {getOrderStatusBadge(order.status)}
                    <span className="font-semibold text-secondary">
                      {order.price > 0 ? `${order.price.toLocaleString('ru-RU')} ₽` : 'Бесплатно'}
                    </span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default CabinetOrdersTab;
