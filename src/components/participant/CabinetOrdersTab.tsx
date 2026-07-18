import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const ORDERS_URL = 'https://functions.poehali.dev/b020db38-8100-400d-9e53-2dbfcafd5f48';

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

const UNPAID_STATUSES = ['new', 'pending'];

const getOrderStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; className: string }> = {
    new: { label: 'Не оплачен', className: 'bg-red-500 hover:bg-red-600' },
    pending: { label: 'Не оплачен', className: 'bg-red-500 hover:bg-red-600' },
    paid: { label: 'Оплачен', className: 'bg-green-600 hover:bg-green-700' },
    completed: { label: 'Выполнен', className: 'bg-green-600 hover:bg-green-700' },
    cancelled: { label: 'Отменён', className: 'bg-destructive hover:bg-destructive/90' },
  };
  const info = statusMap[status] || { label: status, className: 'bg-muted-foreground' };
  return <Badge className={info.className}>{info.label}</Badge>;
};

const CabinetOrdersTab = ({ orders, loading, onGoToShop }: CabinetOrdersTabProps) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);
  const { toast } = useToast();

  const handlePay = async (order: ShopOrder) => {
    setPayingId(order.id);
    try {
      const res = await fetch(`${ORDERS_URL}?action=repay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          return_url: `${window.location.origin}/shop/success`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка оплаты');

      if (data.status === 'paid') {
        toast({ title: 'Заказ уже оплачен' });
        return;
      }

      toast({ title: 'Переходим на страницу оплаты...' });
      setTimeout(() => {
        window.location.href = data.payment_url;
      }, 500);
    } catch (e: unknown) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setPayingId(null);
    }
  };

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
          {orders.map((order) => {
            const isUnpaid = UNPAID_STATUSES.includes(order.status);
            const isExpanded = expandedId === order.id;
            const formEntries = Object.entries(order.form_data || {});
            return (
              <Card key={order.id} className={isUnpaid ? 'border-red-300' : ''}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="mb-2 flex items-center gap-2">
                        {order.product_name}
                        <Icon
                          name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                          size={18}
                          className="text-muted-foreground"
                        />
                      </CardTitle>
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

                {isExpanded && (
                  <CardContent className="pt-0">
                    {formEntries.length > 0 && (
                      <div className="border-t pt-4 mb-4 space-y-2">
                        {formEntries.map(([label, value]) => (
                          <div key={label} className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-sm">
                            <span className="text-muted-foreground sm:col-span-1">{label}</span>
                            <span className="sm:col-span-2 font-medium break-words">{value || '—'}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {isUnpaid && (
                      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                        <Icon name="AlertTriangle" size={18} className="text-red-600 shrink-0" />
                        <p className="text-sm text-red-800 flex-1">
                          Заказ не оплачен. Оплата могла не пройти по техническим причинам — вы можете оплатить его повторно.
                        </p>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 gap-1.5 shrink-0"
                          disabled={payingId === order.id}
                          onClick={(e) => { e.stopPropagation(); handlePay(order); }}
                        >
                          {payingId === order.id ? (
                            <Icon name="Loader2" size={14} className="animate-spin" />
                          ) : (
                            <Icon name="CreditCard" size={14} />
                          )}
                          Оплатить
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
};

export default CabinetOrdersTab;
