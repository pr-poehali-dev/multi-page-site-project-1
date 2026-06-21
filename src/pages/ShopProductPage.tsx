import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const PRODUCTS_URL = 'https://functions.poehali.dev/eddcb40d-3bae-4f75-9c69-390ad1190d83';
const ORDERS_URL = 'https://functions.poehali.dev/b020db38-8100-400d-9e53-2dbfcafd5f48';

interface FormField {
  id: number;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  sort_order: number;
}
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  photo_url: string;
  payment_url: string;
  contest_title: string;
}

const ShopProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [formValues, setFormValues] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${PRODUCTS_URL}?action=product&id=${id}`)
      .then(r => r.json())
      .then(d => {
        setProduct(d.product);
        setFields(d.fields || []);
        const init: Record<number, string> = {};
        (d.fields || []).forEach((f: FormField) => { init[f.id] = ''; });
        setFormValues(init);
      })
      .catch(() => toast({ title: 'Ошибка загрузки товара', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    // Validate required
    for (const f of fields) {
      if (f.is_required && !formValues[f.id]?.trim()) {
        toast({ title: `Заполните поле: ${f.field_label}`, variant: 'destructive' });
        return;
      }
    }
    // Build named form data for storage
    const namedData: Record<string, string> = {};
    fields.forEach(f => { namedData[f.field_label || f.field_name] = formValues[f.id] || ''; });
    setSubmitting(true);
    try {
      const res = await fetch(`${ORDERS_URL}?action=pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product!.id,
          form_data: namedData,
          return_url: `${window.location.origin}/shop/success`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: 'Заявка принята!', description: 'Переходим на страницу оплаты...' });
      setTimeout(() => {
        window.location.href = data.payment_url;
      }, 800);
    } catch (e: unknown) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (f: FormField) => {
    const value = formValues[f.id] || '';
    const onChange = (val: string) => setFormValues(v => ({ ...v, [f.id]: val }));

    if (f.field_type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={f.field_label}
          className="w-full border rounded-md px-3 py-2 text-sm resize-none h-24 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          required={f.is_required}
        />
      );
    }
    if (f.field_type === 'select') {
      const options = f.field_label.includes(':')
        ? f.field_label.split(':')[1].split(',').map(s => s.trim())
        : [];
      const label = f.field_label.includes(':') ? f.field_label.split(':')[0] : f.field_label;
      return (
        <div>
          <label className="text-sm font-medium mb-1 block">
            {label}{f.is_required && <span className="text-destructive ml-1">*</span>}
          </label>
          <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Выберите...</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    }
    return (
      <Input
        type={f.field_type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={f.field_label}
        required={f.is_required}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-40 text-center text-muted-foreground">
          <Icon name="Loader" size={40} className="mx-auto mb-3 animate-spin" />
          <p>Загрузка...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-40 text-center text-muted-foreground">
          <Icon name="PackageOpen" size={56} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">Товар не найден</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/shop')}>
            В магазин
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {lightbox && product.photo_url && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer"
          onClick={() => setLightbox(false)}
        >
          <img src={product.photo_url} alt={product.name} className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl" />
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(false)}>
            <Icon name="X" size={32} />
          </button>
        </div>
      )}

      <section className="pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/shop')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <Icon name="ArrowLeft" size={18} /> Назад в магазин
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            {/* Photo */}
            <div>
              {product.photo_url ? (
                <div
                  className="relative cursor-pointer rounded-2xl overflow-hidden group shadow-lg bg-muted flex items-center justify-center"
                  onClick={() => setLightbox(true)}
                >
                  <img src={product.photo_url} alt={product.name} className="w-full h-auto object-contain rounded-2xl group-hover:opacity-90 transition-opacity" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Icon name="ZoomIn" size={36} className="text-white drop-shadow" />
                  </div>
                </div>
              ) : (
                <div className="w-full rounded-2xl bg-muted flex items-center justify-center" style={{ minHeight: '240px' }}>
                  <Icon name="Image" size={56} className="text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Info + Form */}
            <div className="flex flex-col">
              {product.contest_title && (
                <p className="text-sm text-muted-foreground mb-1">{product.contest_title}</p>
              )}
              <h1 className="text-3xl font-heading font-bold mb-2">{product.name}</h1>
              {product.description && (
                <p className="text-muted-foreground mb-4">{product.description}</p>
              )}
              <p className="text-2xl font-bold text-secondary mb-6">
                {product.price > 0 ? `${product.price.toLocaleString('ru-RU')} ₽` : 'Бесплатно'}
              </p>

              {/* Order form */}
              {fields.length > 0 ? (
                <Card className="p-5 flex-1">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Icon name="ClipboardList" size={16} className="text-primary" />
                    Заявка на заказ
                  </h2>
                  <div className="space-y-4 mb-6">
                    {fields.map(f => (
                      <div key={f.id}>
                        {f.field_type !== 'select' && (
                          <label className="text-sm font-medium mb-1 block">
                            {f.field_label}
                            {f.is_required && <span className="text-destructive ml-1">*</span>}
                          </label>
                        )}
                        {renderField(f)}
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting
                      ? <><Icon name="Loader" size={18} className="mr-2 animate-spin" />Отправляем...</>
                      : <><Icon name="ShoppingCart" size={18} className="mr-2" />Заказать</>}
                  </Button>
                  {product.payment_url && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      После отправки заявки вы будете перенаправлены на страницу оплаты
                    </p>
                  )}
                </Card>
              ) : (
                <Card className="p-5">
                  <p className="text-muted-foreground mb-4 text-sm">Нажмите кнопку для оформления заказа</p>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting
                      ? <><Icon name="Loader" size={18} className="mr-2 animate-spin" />Отправляем...</>
                      : <><Icon name="ShoppingCart" size={18} className="mr-2" />Заказать</>}
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ShopProductPage;