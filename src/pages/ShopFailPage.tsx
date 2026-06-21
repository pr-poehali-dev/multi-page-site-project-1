import { useSearchParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const ShopFailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order_id');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <Icon name="XCircle" size={44} className="text-red-500" />
          </div>
          <h1 className="text-3xl font-heading font-bold mb-3">Оплата не прошла</h1>
          {orderId && (
            <p className="text-muted-foreground mb-2">Заказ №{orderId}</p>
          )}
          <p className="text-muted-foreground mb-8">
            Платёж был отменён или отклонён банком. Вы можете попробовать снова или выбрать другой способ оплаты.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate(-1)}>
              Попробовать снова
            </Button>
            <Button variant="outline" onClick={() => navigate('/shop')}>
              Вернуться в магазин
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ShopFailPage;
