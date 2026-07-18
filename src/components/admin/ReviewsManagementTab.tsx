import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const REVIEWS_URL = 'https://functions.poehali.dev/7b3c1e0e-bd68-4b73-9377-740689560912?entity=reviews';

interface Review {
  id: number;
  full_name: string;
  team_name: string;
  text: string;
  is_published: boolean;
  created_at: string;
}

const ReviewsManagementTab = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { toast } = useToast();

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${REVIEWS_URL}&action=all`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      toast({ title: 'Не удалось загрузить отзывы', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const togglePublish = async (review: Review) => {
    setBusyId(review.id);
    try {
      const action = review.is_published ? 'unpublish' : 'publish';
      const res = await fetch(`${REVIEWS_URL}&id=${review.id}&action=${action}`, { method: 'PUT' });
      if (!res.ok) throw new Error();
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_published: !r.is_published } : r));
      toast({ title: review.is_published ? 'Отзыв снят с публикации' : 'Отзыв опубликован' });
    } catch {
      toast({ title: 'Ошибка обновления статуса', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const deleteReview = async (review: Review) => {
    if (!confirm(`Удалить отзыв от "${review.full_name}"?`)) return;
    setBusyId(review.id);
    try {
      const res = await fetch(`${REVIEWS_URL}&id=${review.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setReviews(prev => prev.filter(r => r.id !== review.id));
      toast({ title: 'Отзыв удалён' });
    } catch {
      toast({ title: 'Ошибка удаления', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = reviews.filter(r => !r.is_published).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-heading font-bold">Отзывы участников</h2>
          <p className="text-muted-foreground">
            Всего отзывов: {reviews.length}{pendingCount > 0 && ` · На модерации: ${pendingCount}`}
          </p>
        </div>
        <Button variant="outline" onClick={loadReviews}>
          <Icon name="RefreshCw" size={16} className="mr-2" />
          Обновить
        </Button>
      </div>

      {reviews.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon name="MessageSquareHeart" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Отзывов пока нет</h3>
          <p className="text-muted-foreground">Отзывы, оставленные на сайте, появятся здесь</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-heading font-bold">{review.full_name}</h3>
                  {review.team_name && (
                    <p className="text-sm text-muted-foreground">{review.team_name}</p>
                  )}
                </div>
                <Badge variant={review.is_published ? 'default' : 'secondary'} className={review.is_published ? 'bg-green-600' : ''}>
                  {review.is_published ? 'Опубликован' : 'На модерации'}
                </Badge>
              </div>

              <p className="text-sm text-foreground/90 whitespace-pre-wrap mb-4">{review.text}</p>

              <p className="text-xs text-muted-foreground mb-4">
                {new Date(review.created_at).toLocaleDateString('ru-RU', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>

              <div className="flex gap-2">
                <Button
                  variant={review.is_published ? 'outline' : 'default'}
                  size="sm"
                  className={`flex-1 ${!review.is_published ? 'bg-secondary hover:bg-secondary/90' : ''}`}
                  disabled={busyId === review.id}
                  onClick={() => togglePublish(review)}
                >
                  <Icon name={review.is_published ? 'EyeOff' : 'Check'} size={16} className="mr-1" />
                  {review.is_published ? 'Скрыть' : 'Опубликовать'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === review.id}
                  onClick={() => deleteReview(review)}
                >
                  <Icon name="Trash2" size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsManagementTab;
