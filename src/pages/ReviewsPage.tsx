import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useSEO } from '@/hooks/useSEO';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/compressImage';

const REVIEWS_URL = 'https://functions.poehali.dev/7b3c1e0e-bd68-4b73-9377-740689560912?entity=reviews';
const UPLOAD_URL = 'https://functions.poehali.dev/cfc99bc2-daff-4110-b9e4-c9699841a7d3';

interface Review {
  id: number;
  full_name: string;
  team_name: string;
  text: string;
  photo_url?: string;
  created_at: string;
}

const AVATAR_COLORS = [
  'from-primary to-secondary',
  'from-secondary to-primary',
  'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-orange-500 to-red-500',
  'from-green-500 to-emerald-500',
];

const ReviewsPage = () => {
  useSEO({
    title: 'Отзывы участников',
    description: 'Отзывы участников и коллективов о конкурсах ИНДИГО. Поделитесь своими впечатлениями!',
    keywords: 'отзывы конкурс ИНДИГО, отзывы участников, впечатления о конкурсе',
    path: '/reviews',
  });

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fullName, setFullName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [text, setText] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${REVIEWS_URL}&action=public`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const compressed = await compressImage(file, { maxDimension: 800, maxSizeBytes: 700 * 1024 });
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = e => resolve((e.target!.result as string).split(',')[1]);
        r.onerror = reject;
        r.readAsDataURL(compressed);
      });
      const res = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: [{ fileName: compressed.name, fileType: compressed.type, fileSize: compressed.size, fileData: b64 }],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.files?.[0]) throw new Error(data.error);
      setPhotoUrl(data.files[0].fileUrl);
    } catch {
      toast({ title: 'Не удалось загрузить фото', variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !text.trim()) {
      toast({ title: 'Заполните имя и текст отзыва', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(REVIEWS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim(), team_name: teamName.trim(), text: text.trim(), photo_url: photoUrl }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      setFullName('');
      setTeamName('');
      setText('');
      setPhotoUrl('');
    } catch {
      toast({ title: 'Не удалось отправить отзыв', description: 'Попробуйте ещё раз', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-10 right-0 w-72 h-72 bg-secondary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center mb-14 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Icon name="MessageCircle" size={16} />
              Отзывы участников
            </div>
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6">
              Что говорят о нас
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">Истории и впечатления коллективов, 
которые уже стали частью большой творческой семьи 
ИНДИГО</p>
            <Button
              size="lg"
              onClick={() => setShowForm(v => !v)}
              className="bg-secondary hover:bg-secondary/90 gap-2"
            >
              <Icon name={showForm ? 'X' : 'Pencil'} size={18} />
              {showForm ? 'Закрыть форму' : 'Оставить отзыв'}
            </Button>
          </div>

          {/* Форма отзыва */}
          {showForm && (
            <Card className="max-w-2xl mx-auto mb-16 p-8 animate-scale-in shadow-xl border-2 border-secondary/20">
              {submitted ? (
                <div className="text-center py-8 animate-fade-in">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="CheckCircle2" size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-2">Спасибо за отзыв!</h3>
                  <p className="text-muted-foreground mb-6">
                    Он появится на сайте после проверки модератором
                  </p>
                  <Button variant="outline" onClick={() => { setSubmitted(false); setShowForm(false); }}>
                    Отлично
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="text-2xl font-heading font-bold mb-1">Ваш отзыв</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Расскажите о своих впечатлениях от участия в конкурсе
                  </p>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Имя Фамилия <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Анна Иванова"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      От кого отзыв (коллектив)
                    </label>
                    <Input
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                      placeholder="Танцевальный коллектив «Радуга»"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Текст отзыва <span className="text-destructive">*</span>
                    </label>
                    <Textarea
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder="Поделитесь впечатлениями от конкурса..."
                      className="min-h-32 resize-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Фото (необязательно)
                    </label>
                    <div className="flex items-center gap-4">
                      {photoUrl && (
                        <img src={photoUrl} alt="Превью" className="w-16 h-16 rounded-full object-cover border-2 border-secondary/30" />
                      )}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoSelect(file);
                          }}
                        />
                        <span className="inline-flex items-center gap-2 text-sm border rounded-md px-4 py-2 hover:bg-muted transition-colors">
                          {uploadingPhoto ? (
                            <Icon name="Loader2" size={16} className="animate-spin" />
                          ) : (
                            <Icon name="ImagePlus" size={16} />
                          )}
                          {photoUrl ? 'Заменить фото' : 'Загрузить фото'}
                        </span>
                      </label>
                    </div>
                  </div>
                  <Button type="submit" disabled={submitting || uploadingPhoto} className="w-full bg-secondary hover:bg-secondary/90 gap-2">
                    {submitting ? (
                      <Icon name="Loader2" size={18} className="animate-spin" />
                    ) : (
                      <Icon name="Send" size={18} />
                    )}
                    Отправить отзыв
                  </Button>
                </form>
              )}
            </Card>
          )}

          {/* Список отзывов */}
          {loading ? (
            <div className="text-center py-16">
              <Icon name="Loader" size={40} className="mx-auto mb-3 animate-spin text-secondary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <Icon name="MessageSquareHeart" size={56} className="mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg text-muted-foreground mb-1">Отзывов пока нет</p>
              <p className="text-sm text-muted-foreground">Станьте первым, кто поделится впечатлениями!</p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 max-w-6xl mx-auto">
              {reviews.map((review, index) => (
                <Card
                  key={review.id}
                  className="break-inside-avoid p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-scale-in relative overflow-hidden group"
                  style={{ animationDelay: `${(index % 9) * 0.08}s` }}
                >
                  <Icon
                    name="Quote"
                    size={64}
                    className="absolute -top-2 -right-2 text-secondary/5 group-hover:text-secondary/10 transition-colors"
                  />
                  <div className="flex items-center gap-3 mb-4 relative">
                    {review.photo_url ? (
                      <img
                        src={review.photo_url}
                        alt={review.full_name}
                        className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-white shadow"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${AVATAR_COLORS[review.id % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-lg shrink-0`}
                      >
                        {review.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-heading font-semibold truncate">{review.full_name}</p>
                      {review.team_name && (
                        <p className="text-sm text-muted-foreground truncate">{review.team_name}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap relative">
                    {review.text}
                  </p>
                  <div className="flex items-center gap-1 mt-4 text-secondary">
                    {[...Array(5)].map((_, i) => (
                      <Icon key={i} name="Star" size={14} className="fill-secondary" />
                    ))}
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

export default ReviewsPage;