import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const ORDERS_URL = 'https://functions.poehali.dev/b020db38-8100-400d-9e53-2dbfcafd5f48';

type Status = 'checking' | 'paid' | 'pending' | 'error';

const ShopSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order_id');
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    if (!orderId) { setStatus('error'); return; }

    let attempts = 0;
    const check = async () => {
      try {
        const res = await fetch(`${ORDERS_URL}?action=check&order_id=${orderId}`);
        const data = await res.json();
        if (data.status === 'paid') {
          setStatus('paid');
        } else if (attempts < 4) {
          attempts++;
          setTimeout(check, 2000);
        } else {
          setStatus('pending');
        }
      } catch {
        setStatus('error');
      }
    };
    check();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
        <div className="max-w-md w-full text-center">
          {status === 'checking' && (
            <>
              <Icon name="Loader" size={56} className="mx-auto mb-4 animate-spin text-primary" />
              <h1 className="text-2xl font-heading font-bold mb-2">Проверяем оплату...</h1>
              <p className="text-muted-foreground">Подождите несколько секунд</p>
            </>
          )}

          {status === 'paid' && (
            <>
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <Icon name="CheckCircle" size={44} className="text-green-600" />
              </div>
              <h1 className="text-3xl font-heading font-bold mb-3">Оплата прошла!</h1>
              <p className="text-muted-foreground mb-2">Заказ №{orderId} успешно оплачен.</p>
              <p className="text-muted-foreground mb-8">Мы получили вашу заявку и свяжемся с вами в ближайшее время.</p>
              <Button onClick={() => navigate('/shop')}>
                Вернуться в магазин
              </Button>
            </>
          )}

          {status === 'pending' && (
            <>
              <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
                <Icon name="Clock" size={44} className="text-yellow-600" />
              </div>
              <h1 className="text-3xl font-heading font-bold mb-3">Ожидаем подтверждение</h1>
              <p className="text-muted-foreground mb-2">Заказ №{orderId} создан.</p>
              <p className="text-muted-foreground mb-8">Банк ещё обрабатывает платёж — статус обновится автоматически в течение нескольких минут.</p>
              <Button onClick={() => navigate('/shop')}>
                Вернуться в магазин
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                <Icon name="XCircle" size={44} className="text-red-500" />
              </div>
              <h1 className="text-3xl font-heading font-bold mb-3">Что-то пошло не так</h1>
              <p className="text-muted-foreground mb-8">Не удалось проверить статус оплаты. Пожалуйста, свяжитесь с нами.</p>
              <Button onClick={() => navigate('/shop')}>
                Вернуться в магазин
              </Button>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ShopSuccessPage;
