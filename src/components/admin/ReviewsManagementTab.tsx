import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
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
  is_published: boolean;
  created_at: string;
}

const ReviewsManagementTab = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { toast } = useToast();

  const [editing, setEditing] = useState<Review | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editTeamName, setEditTeamName] = useState('');
  const [editText, setEditText] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const openEdit = (review: Review) => {
    setEditing(review);
    setEditFullName(review.full_name);
    setEditTeamName(review.team_name);
    setEditText(review.text);
    setEditPhotoUrl(review.photo_url || '');
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
      setEditPhotoUrl(data.files[0].fileUrl);
    } catch {
      toast({ title: 'Не удалось загрузить фото', variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editFullName.trim() || !editText.trim()) {
      toast({ title: 'Заполните имя и текст отзыва', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${REVIEWS_URL}&id=${editing.id}&action=update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editFullName.trim(),
          team_name: editTeamName.trim(),
          text: editText.trim(),
          photo_url: editPhotoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setReviews(prev => prev.map(r => r.id === editing.id ? data.review : r));
      toast({ title: 'Отзыв обновлён' });
      setEditing(null);
    } catch {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' });
    } finally {
      setSaving(false);
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
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {review.photo_url ? (
                    <img src={review.photo_url} alt={review.full_name} className="w-12 h-12 rounded-full object-cover shrink-0 border" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground font-bold">
                      {review.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold truncate">{review.full_name}</h3>
                    {review.team_name && (
                      <p className="text-sm text-muted-foreground truncate">{review.team_name}</p>
                    )}
                  </div>
                </div>
                <Badge variant={review.is_published ? 'default' : 'secondary'} className={`shrink-0 ${review.is_published ? 'bg-green-600' : ''}`}>
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
                <Button variant="outline" size="sm" onClick={() => openEdit(review)}>
                  <Icon name="Pencil" size={16} />
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

      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактировать отзыв</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Имя Фамилия</label>
              <Input value={editFullName} onChange={e => setEditFullName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">От кого отзыв (коллектив)</label>
              <Input value={editTeamName} onChange={e => setEditTeamName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Текст отзыва</label>
              <Textarea value={editText} onChange={e => setEditText(e.target.value)} className="min-h-28 resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Фото</label>
              <div className="flex items-center gap-4">
                {editPhotoUrl ? (
                  <img src={editPhotoUrl} alt="Превью" className="w-16 h-16 rounded-full object-cover border" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Icon name="User" size={24} />
                  </div>
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
                    {editPhotoUrl ? 'Заменить' : 'Загрузить'}
                  </span>
                </label>
                {editPhotoUrl && (
                  <Button variant="ghost" size="sm" onClick={() => setEditPhotoUrl('')}>
                    <Icon name="X" size={16} />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Отмена</Button>
            <Button onClick={saveEdit} disabled={saving || uploadingPhoto} className="bg-secondary hover:bg-secondary/90">
              {saving ? <Icon name="Loader2" size={16} className="mr-2 animate-spin" /> : null}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewsManagementTab;
