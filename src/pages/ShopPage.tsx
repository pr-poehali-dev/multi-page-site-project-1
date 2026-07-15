import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useSEO } from '@/hooks/useSEO';

const PRODUCTS_URL = 'https://functions.poehali.dev/eddcb40d-3bae-4f75-9c69-390ad1190d83';

interface Category { id: number; name: string; sort_order: number; is_active?: boolean; }
interface Product {
  id: number;
  category_id: number | null;
  name: string;
  description: string;
  price: number;
  photo_url: string;
  is_active: boolean;
}

const ShopPage = () => {
  useSEO({
    title: 'Магазин',
    description: 'Официальный магазин ИНДИГО — дипломы, сувениры, атрибутика конкурсов. Заказ и оплата онлайн.',
    keywords: 'магазин ИНДИГО, дипломы, сувениры, атрибутика, купить онлайн',
    path: '/shop',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState('');

  useEffect(() => {
    fetch(`${PRODUCTS_URL}?action=categories`)
      .then(r => r.json())
      .then(d => {
        const list: Category[] = (d.categories || []).filter((c: Category & { name: string }) => c.name !== '__deleted__' && c.is_active !== false);
        setCategories(list);
        if (list.length > 0) setSelectedCatId(String(list[0].id));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedCatId
      ? `${PRODUCTS_URL}?action=list&category_id=${selectedCatId}&public=true`
      : `${PRODUCTS_URL}?action=list&public=true`;
    fetch(url)
      .then(r => r.json())
      .then(d => setProducts((d.products || []).filter((p: Product) => p.is_active)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [selectedCatId]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {lightboxSrc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer"
          onClick={() => setLightboxSrc('')}>
          <img src={lightboxSrc} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl" />
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightboxSrc('')}>
            <Icon name="X" size={32} />
          </button>
        </div>
      )}

      <section className="pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2">Интернет-магазин</h1>
          </div>

          {/* Category selector */}
          {categories.length > 0 && (
            <div className="mb-8 max-w-xs">
              <Select value={selectedCatId || 'all'} onValueChange={v => setSelectedCatId(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Все товары" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все товары</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-muted-foreground">
              <Icon name="Loader" size={40} className="mx-auto mb-3 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Icon name="PackageOpen" size={56} className="mx-auto mb-3 opacity-30" />
              <p className="text-lg">В этом разделе пока нет товаров</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map(p => (
                <Card key={p.id} className="overflow-hidden group flex flex-col">
                  <div className="relative bg-muted cursor-pointer flex items-center justify-center" style={{ minHeight: '180px', maxHeight: '320px' }}
                    onClick={() => p.photo_url && setLightboxSrc(p.photo_url)}>
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.name}
                        className="w-full h-auto object-contain transition-opacity duration-300 group-hover:opacity-90" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="Image" size={40} className="text-muted-foreground/30" />
                      </div>
                    )}
                    {p.photo_url && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Icon name="ZoomIn" size={28} className="text-white drop-shadow" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-semibold text-sm leading-tight mb-1 flex-1">{p.name}</h3>
                    <p className="font-bold text-base text-secondary mb-3">
                      {p.price > 0 ? `${p.price.toLocaleString('ru-RU')} ₽` : 'Бесплатно'}
                    </p>
                    <Link to={`/shop/${p.id}`}>
                      <Button size="sm" className="w-full">Заказать</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ShopPage;