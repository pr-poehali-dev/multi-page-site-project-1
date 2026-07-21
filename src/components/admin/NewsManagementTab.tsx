import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/compressImage';

const NEWS_URL = 'https://functions.poehali.dev/7b3c1e0e-bd68-4b73-9377-740689560912?entity=news';
const UPLOAD_URL = 'https://functions.poehali.dev/cfc99bc2-daff-4110-b9e4-c9699841a7d3';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  is_published: boolean;
  created_at: string;
}

const emptyForm = { title: '', content: '', image_url: '', is_published: true };

const NewsManagementTab = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadNews = async () => {
    setLoading(true);
    try {
      const res = await fetch(NEWS_URL);
      const data = await res.json();
      setNews(data.news || []);
    } catch {
      toast({ title: 'Не удалось загрузить новости', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: NewsItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      content: item.content,
      image_url: item.image_url || '',
      is_published: item.is_published,
    });
    setModalOpen(true);
  };

  const handlePhotoSelect = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const compressed = await compressImage(file, { maxDimension: 1200, maxSizeBytes: 900 * 1024 });
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
      setForm(prev => ({ ...prev, image_url: data.files[0].fileUrl }));
    } catch {
      toast({ title: 'Не удалось загрузить фото', variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveNews = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: 'Заполните заголовок и текст новости', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `${NEWS_URL}&id=${editing.id}` : NEWS_URL;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim(),
          image_url: form.image_url,
          is_published: form.is_published,
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: editing ? 'Новость обновлена' : 'Новость опубликована' });
      setModalOpen(false);
      loadNews();
    } catch {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (item: NewsItem) => {
    setBusyId(item.id);
    try {
      const res = await fetch(`${NEWS_URL}&id=${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !item.is_published }),
      });
      if (!res.ok) throw new Error();
      setNews(prev => prev.map(n => n.id === item.id ? { ...n, is_published: !n.is_published } : n));
      toast({ title: item.is_published ? 'Новость снята с публикации' : 'Новость опубликована' });
    } catch {
      toast({ title: 'Ошибка обновления статуса', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const deleteNews = async (item: NewsItem) => {
    if (!confirm(`Удалить новость "${item.title}"?`)) return;
    setBusyId(item.id);
    try {
      const res = await fetch(`${NEWS_URL}&id=${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setNews(prev => prev.filter(n => n.id !== item.id));
      toast({ title: 'Новость удалена' });
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold">Новости ИНДИГО</h2>
          <p className="text-muted-foreground">Всего новостей: {news.length}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadNews}>
            <Icon name="RefreshCw" size={16} className="mr-2" />
            Обновить
          </Button>
          <Button onClick={openCreate} className="bg-secondary hover:bg-secondary/90">
            <Icon name="Plus" size={16} className="mr-2" />
            Добавить новость
          </Button>
        </div>
      </div>

      {news.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon name="Newspaper" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Новостей пока нет</h3>
          <p className="text-muted-foreground">Добавьте первую новость — она появится в личном кабинете участников</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {news.map((item) => (
            <Card key={item.id} className="overflow-hidden flex flex-col">
              {item.image_url && (
                <img src={item.image_url} alt={item.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-heading font-bold leading-tight">{item.title}</h3>
                  <Badge variant={item.is_published ? 'default' : 'secondary'} className={`shrink-0 ${item.is_published ? 'bg-green-600' : ''}`}>
                    {item.is_published ? 'Опубликована' : 'Черновик'}
                  </Badge>
                </div>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap mb-3 flex-1 line-clamp-4">{item.content}</p>
                <p className="text-xs text-muted-foreground mb-4">
                  {new Date(item.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
                <div className="flex gap-2 mt-auto">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(item)}>
                    <Icon name="Edit" size={14} className="mr-1.5" />
                    Изменить
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === item.id}
                    onClick={() => togglePublish(item)}
                    title={item.is_published ? 'Снять с публикации' : 'Опубликовать'}
                  >
                    <Icon name={item.is_published ? 'EyeOff' : 'Eye'} size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    disabled={busyId === item.id}
                    onClick={() => deleteNews(item)}
                  >
                    <Icon name="Trash2" size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Изменить новость' : 'Новая новость'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Заголовок</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Например: Открыт приём заявок на новый сезон"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Текст новости</label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={5}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Изображение (по желанию)</label>
              {form.image_url && (
                <img src={form.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
              )}
              <Input
                type="file"
                accept="image/*"
                disabled={uploadingPhoto}
                onChange={(e) => e.target.files?.[0] && handlePhotoSelect(e.target.files[0])}
              />
              {uploadingPhoto && <p className="text-xs text-muted-foreground mt-1">Загрузка...</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_published"
                checked={form.is_published}
                onCheckedChange={(checked) => setForm({ ...form, is_published: checked })}
              />
              <label htmlFor="is_published" className="text-sm">Опубликовать сразу</label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button onClick={saveNews} disabled={saving} className="bg-secondary hover:bg-secondary/90">
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewsManagementTab;
