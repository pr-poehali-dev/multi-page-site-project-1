import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

const PRODUCTS_URL = 'https://functions.poehali.dev/eddcb40d-3bae-4f75-9c69-390ad1190d83';
const CONTESTS_URL = 'https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3';

interface Contest { id: number; title: string; }
interface Product {
  id: number;
  contest_id: number;
  name: string;
  description: string;
  price: number;
  photo_url: string;
  is_active: boolean;
}

const ShopPage = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState('');

  useEffect(() => {
    fetch(CONTESTS_URL)
      .then(r => r.json())
      .then(d => {
        const list: Contest[] = d.contests || d || [];
        setContests(list);
        if (list.length > 0) setSelectedContestId(String(list[0].id));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedContestId) return;
    setLoading(true);
    fetch(`${PRODUCTS_URL}?action=list&contest_id=${selectedContestId}`)
      .then(r => r.json())
      .then(d => setProducts((d.products || []).filter((p: Product) => p.is_active)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [selectedContestId]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer"
          onClick={() => setLightboxSrc('')}
        >
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
            <p className="text-muted-foreground text-lg">Выберите раздел конкурса</p>
          </div>

          {/* Contest selector */}
          <div className="mb-8 max-w-xs">
            <Select value={selectedContestId} onValueChange={setSelectedContestId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Выберите конкурс..." />
              </SelectTrigger>
              <SelectContent>
                {contests.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-20 text-muted-foreground">
              <Icon name="Loader" size={40} className="mx-auto mb-3 animate-spin" />
              <p>Загрузка...</p>
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
                  {/* Photo — ~5×8 cm at 96dpi ≈ 190×304px */}
                  <div
                    className="relative overflow-hidden bg-muted cursor-pointer"
                    style={{ aspectRatio: '5/8' }}
                    onClick={() => p.photo_url && setLightboxSrc(p.photo_url)}
                  >
                    {p.photo_url ? (
                      <img
                        src={p.photo_url}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
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
