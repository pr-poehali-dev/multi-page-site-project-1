import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const PRODUCTS_URL = 'https://functions.poehali.dev/eddcb40d-3bae-4f75-9c69-390ad1190d83';
const ORDERS_URL = 'https://functions.poehali.dev/b020db38-8100-400d-9e53-2dbfcafd5f48';

interface Contest { id: number; title: string; }
interface FormField {
  id?: number;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  sort_order: number;
}
interface Product {
  id: number;
  contest_id: number;
  name: string;
  description: string;
  price: number;
  photo_url: string;
  payment_url: string;
  is_active: boolean;
  sort_order: number;
}
interface Order {
  id: number;
  product_name: string;
  price: number;
  status: string;
  created_at: string;
  form_data: Record<string, string>;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Текст' },
  { value: 'number', label: 'Число' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Телефон' },
  { value: 'textarea', label: 'Многострочный текст' },
  { value: 'select', label: 'Список (options через запятую)' },
  { value: 'date', label: 'Дата' },
];

const emptyProduct = (): Omit<Product, 'id'> => ({
  contest_id: 0,
  name: '',
  description: '',
  price: 0,
  photo_url: '',
  payment_url: '',
  is_active: true,
  sort_order: 0,
});

const ShopTab = ({ contests }: { contests: Contest[] }) => {
  const { toast } = useToast();
  const [view, setView] = useState<'products' | 'orders' | 'archive'>('products');
  const [selectedContestId, setSelectedContestId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // product form
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct());
  const [savingProduct, setSavingProduct] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // fields editor
  const [showFieldsEditor, setShowFieldsEditor] = useState(false);
  const [fieldsProduct, setFieldsProduct] = useState<Product | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [savingFields, setSavingFields] = useState(false);

  const loadProducts = async (contestId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${PRODUCTS_URL}?action=list&contest_id=${contestId}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить товары', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const loadOrders = async (contestId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${ORDERS_URL}?contest_id=${contestId}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить заказы', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!selectedContestId) return;
    if (view === 'products') loadProducts(selectedContestId);
    else loadOrders(selectedContestId);
  }, [selectedContestId, view]);

  const openCreate = () => {
    setEditingProduct(null);
    setForm({ ...emptyProduct(), contest_id: Number(selectedContestId) });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({ ...p });
    setShowForm(true);
  };

  const saveProduct = async () => {
    if (!form.name.trim()) return toast({ title: 'Укажите название товара', variant: 'destructive' });
    setSavingProduct(true);
    try {
      let res: Response;
      if (editingProduct) {
        res = await fetch(`${PRODUCTS_URL}?action=update&id=${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch(`${PRODUCTS_URL}?action=create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: editingProduct ? 'Товар обновлён' : 'Товар создан' });
      setShowForm(false);
      loadProducts(selectedContestId);
    } catch (e: unknown) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    } finally { setSavingProduct(false); }
  };

  const uploadPhoto = async (file: File, productId: number) => {
    setUploadingPhoto(true);
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = e => resolve((e.target!.result as string).split(',')[1]);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const res = await fetch(`${PRODUCTS_URL}?action=upload_photo&id=${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_base64: b64, file_name: file.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm(f => ({ ...f, photo_url: data.photo_url }));
      if (editingProduct) {
        setProducts(ps => ps.map(p => p.id === productId ? { ...p, photo_url: data.photo_url } : p));
      }
      toast({ title: 'Фото загружено' });
    } catch (e: unknown) {
      toast({ title: 'Ошибка загрузки фото', description: (e as Error).message, variant: 'destructive' });
    } finally { setUploadingPhoto(false); }
  };

  const openFieldsEditor = async (p: Product) => {
    setFieldsProduct(p);
    try {
      const res = await fetch(`${PRODUCTS_URL}?action=fields&product_id=${p.id}`);
      const data = await res.json();
      setFields(data.fields || []);
    } catch { setFields([]); }
    setShowFieldsEditor(true);
  };

  const addField = () => {
    setFields(fs => [...fs, {
      field_name: '', field_label: '', field_type: 'text',
      is_required: false, sort_order: fs.length,
    }]);
  };

  const updateField = (i: number, key: keyof FormField, val: string | boolean | number) => {
    setFields(fs => fs.map((f, idx) => idx === i ? { ...f, [key]: val } : f));
  };

  const removeField = (i: number) => {
    setFields(fs => fs.filter((_, idx) => idx !== i));
  };

  const saveFields = async () => {
    if (!fieldsProduct) return;
    setSavingFields(true);
    try {
      const res = await fetch(`${PRODUCTS_URL}?action=save_fields&product_id=${fieldsProduct.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFields(data.fields || []);
      toast({ title: 'Поля формы сохранены' });
    } catch (e: unknown) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    } finally { setSavingFields(false); }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await fetch(`${ORDERS_URL}?id=${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setOrders(os => os.map(o => o.id === orderId ? { ...o, status } : o));
    } catch {
      toast({ title: 'Ошибка обновления статуса', variant: 'destructive' });
    }
  };

  const STATUS_LABELS: Record<string, string> = {
    new: 'Новый', paid: 'Оплачен', cancelled: 'Отменён', completed: 'Выполнен',
  };

  const exportToExcel = (list: Order[], filename: string) => {
    if (list.length === 0) {
      toast({ title: 'Нет данных для экспорта', variant: 'destructive' });
      return;
    }
    // Collect all form_data keys
    const formKeys = Array.from(new Set(list.flatMap(o => Object.keys(o.form_data || {}))));
    const headers = ['№', 'Товар', 'Цена', 'Статус', 'Дата', ...formKeys];
    const rows = list.map(o => [
      o.id,
      o.product_name,
      Number(o.price).toLocaleString('ru-RU'),
      STATUS_LABELS[o.status] || o.status,
      new Date(o.created_at).toLocaleString('ru-RU'),
      ...formKeys.map(k => o.form_data?.[k] || ''),
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const archiveOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');

  // ── Render ──────────────────────────────────────────────────────────────────
  if (showFieldsEditor && fieldsProduct) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" onClick={() => setShowFieldsEditor(false)}>
            <Icon name="ArrowLeft" size={16} className="mr-2" /> Назад
          </Button>
          <h2 className="text-xl font-semibold">Поля формы: {fieldsProduct.name}</h2>
        </div>
        <Card className="p-5 mb-4">
          <div className="space-y-3">
            {fields.filter(f => f.field_label !== '__deleted__' && f.field_name !== '__deleted__').map((f, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center border rounded-lg p-3">
                <div className="col-span-3">
                  <label className="text-xs text-muted-foreground mb-1 block">Название поля</label>
                  <Input value={f.field_label} onChange={e => updateField(i, 'field_label', e.target.value)} placeholder="Например: Имя" />
                </div>
                <div className="col-span-3">
                  <label className="text-xs text-muted-foreground mb-1 block">Тип</label>
                  <Select value={f.field_type} onValueChange={v => updateField(i, 'field_type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4">
                  <label className="text-xs text-muted-foreground mb-1 block">Системное имя (авто)</label>
                  <Input
                    value={f.field_name || f.field_label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-zа-яё0-9_]/gi, '')}
                    onChange={e => updateField(i, 'field_name', e.target.value)}
                    placeholder="field_name"
                  />
                </div>
                <div className="col-span-1 flex flex-col items-center gap-1">
                  <label className="text-xs text-muted-foreground">Обяз.</label>
                  <input type="checkbox" checked={f.is_required} onChange={e => updateField(i, 'is_required', e.target.checked)} className="w-4 h-4 cursor-pointer" />
                </div>
                <div className="col-span-1 flex items-end justify-center">
                  <Button variant="ghost" size="sm" onClick={() => removeField(i)} className="text-destructive hover:text-destructive">
                    <Icon name="Trash2" size={14} />
                  </Button>
                </div>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-muted-foreground text-center py-6">Нет полей. Добавьте первое поле.</p>
            )}
          </div>
        </Card>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addField}>
            <Icon name="Plus" size={16} className="mr-2" /> Добавить поле
          </Button>
          <Button onClick={saveFields} disabled={savingFields}>
            {savingFields ? <Icon name="Loader" size={16} className="mr-2 animate-spin" /> : <Icon name="Save" size={16} className="mr-2" />}
            Сохранить
          </Button>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" onClick={() => setShowForm(false)}>
            <Icon name="ArrowLeft" size={16} className="mr-2" /> Назад
          </Button>
          <h2 className="text-xl font-semibold">{editingProduct ? 'Редактировать товар' : 'Новый товар'}</h2>
        </div>
        <Card className="p-6 space-y-4 max-w-2xl">
          <div>
            <label className="text-sm font-medium mb-1 block">Название товара *</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Название" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Описание</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Описание товара..."
              className="w-full border rounded-md px-3 py-2 text-sm resize-none h-24 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Цена (руб.)</label>
              <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="0" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Порядок сортировки</label>
              <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Ссылка на оплату</label>
            <Input value={form.payment_url} onChange={e => setForm(f => ({ ...f, payment_url: e.target.value }))} placeholder="https://..." />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 cursor-pointer" />
            <label htmlFor="is_active" className="text-sm cursor-pointer">Активен (отображается в магазине)</label>
          </div>

          {/* Photo */}
          <div>
            <label className="text-sm font-medium mb-2 block">Фото товара</label>
            {form.photo_url && (
              <img src={form.photo_url} alt="Фото" className="w-32 h-32 object-cover rounded-lg border mb-2" />
            )}
            {editingProduct ? (
              <>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file && editingProduct) uploadPhoto(file, editingProduct.id);
                }} />
                <Button variant="outline" size="sm" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}>
                  {uploadingPhoto ? <Icon name="Loader" size={14} className="mr-2 animate-spin" /> : <Icon name="Upload" size={14} className="mr-2" />}
                  {form.photo_url ? 'Заменить фото' : 'Загрузить фото'}
                </Button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Сначала создайте товар, затем загрузите фото</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={saveProduct} disabled={savingProduct}>
              {savingProduct ? <Icon name="Loader" size={16} className="mr-2 animate-spin" /> : <Icon name="Save" size={16} className="mr-2" />}
              {editingProduct ? 'Сохранить' : 'Создать'}
            </Button>
            {editingProduct && (
              <Button variant="outline" onClick={() => { setShowForm(false); openFieldsEditor(editingProduct); }}>
                <Icon name="ListChecks" size={16} className="mr-2" /> Настроить форму заявки
              </Button>
            )}
            <Button variant="ghost" onClick={() => setShowForm(false)}>Отмена</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-heading font-bold">Интернет-магазин</h2>
        <div className="flex gap-2 flex-wrap">
          <Button variant={view === 'products' ? 'default' : 'outline'} onClick={() => setView('products')}>
            <Icon name="ShoppingBag" size={16} className="mr-2" /> Товары
          </Button>
          <Button variant={view === 'orders' ? 'default' : 'outline'} onClick={() => setView('orders')}>
            <Icon name="ClipboardList" size={16} className="mr-2" /> Заказы
            {activeOrders.length > 0 && <span className="ml-1 bg-primary-foreground text-primary rounded-full text-xs px-1.5">{activeOrders.length}</span>}
          </Button>
          <Button variant={view === 'archive' ? 'default' : 'outline'} onClick={() => setView('archive')}>
            <Icon name="Archive" size={16} className="mr-2" /> Архив
            {archiveOrders.length > 0 && <span className="ml-1 bg-primary-foreground text-primary rounded-full text-xs px-1.5">{archiveOrders.length}</span>}
          </Button>
        </div>
      </div>

      {/* Contest selector */}
      <div className="mb-6 max-w-xs">
        <label className="text-sm font-medium mb-1 block">Раздел (конкурс)</label>
        <Select value={selectedContestId} onValueChange={setSelectedContestId}>
          <SelectTrigger><SelectValue placeholder="Выберите конкурс..." /></SelectTrigger>
          <SelectContent>
            {contests.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!selectedContestId && (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="ShoppingBag" size={48} className="mx-auto mb-3 opacity-30" />
          <p>Выберите конкурс для работы с магазином</p>
        </div>
      )}

      {/* PRODUCTS */}
      {selectedContestId && view === 'products' && (
        <>
          <div className="flex justify-end mb-4">
            <Button onClick={openCreate}>
              <Icon name="Plus" size={16} className="mr-2" /> Добавить товар
            </Button>
          </div>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Loader" size={32} className="mx-auto mb-2 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="PackageOpen" size={48} className="mx-auto mb-3 opacity-30" />
              <p>Товаров нет. Добавьте первый товар.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => (
                <Card key={p.id} className="overflow-hidden">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-muted flex items-center justify-center">
                      <Icon name="Image" size={32} className="text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold leading-tight">{p.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                        {p.is_active ? 'Активен' : 'Скрыт'}
                      </span>
                    </div>
                    {p.description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{p.description}</p>}
                    <p className="font-bold text-lg mb-3">{p.price.toLocaleString('ru-RU')} ₽</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                        <Icon name="Pencil" size={13} className="mr-1" /> Изм.
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openFieldsEditor(p)}>
                        <Icon name="ListChecks" size={13} className="mr-1" /> Форма
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ORDERS & ARCHIVE */}
      {selectedContestId && (view === 'orders' || view === 'archive') && (
        <>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Loader" size={32} className="mx-auto mb-2 animate-spin" />
            </div>
          ) : (() => {
            const list = view === 'orders' ? activeOrders : archiveOrders;
            const emptyLabel = view === 'orders' ? 'Активных заказов пока нет' : 'Архив пуст';
            const exportName = view === 'orders' ? 'заказы_активные' : 'заказы_архив';
            return (
              <>
                <div className="flex justify-end mb-4">
                  <Button variant="outline" size="sm" onClick={() => exportToExcel(list, exportName)}>
                    <Icon name="Download" size={15} className="mr-2" /> Экспорт в Excel
                  </Button>
                </div>
                {list.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Icon name={view === 'orders' ? 'ClipboardList' : 'Archive'} size={48} className="mx-auto mb-3 opacity-30" />
                    <p>{emptyLabel}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {list.map(o => (
                      <Card key={o.id} className={`p-4 ${view === 'archive' ? 'opacity-75' : ''}`}>
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-muted-foreground">#{o.id}</span>
                              <span className="font-medium">{o.product_name}</span>
                              <span className="font-bold text-secondary">{Number(o.price).toLocaleString('ru-RU')} ₽</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                o.status === 'new' ? 'bg-blue-100 text-blue-700' :
                                o.status === 'paid' ? 'bg-green-100 text-green-700' :
                                o.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                                'bg-red-100 text-red-600'
                              }`}>
                                {STATUS_LABELS[o.status] || o.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{new Date(o.created_at).toLocaleString('ru-RU')}</p>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                              {Object.entries(o.form_data || {}).map(([k, v]) => (
                                <p key={k} className="text-sm"><span className="text-muted-foreground">{k}:</span> {v}</p>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select value={o.status} onValueChange={v => updateOrderStatus(o.id, v)}>
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                                  <SelectItem key={v} value={v}>{l}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
};

export default ShopTab;