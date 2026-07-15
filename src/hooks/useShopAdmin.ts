import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const PRODUCTS_URL = 'https://functions.poehali.dev/eddcb40d-3bae-4f75-9c69-390ad1190d83';
const ORDERS_URL = 'https://functions.poehali.dev/b020db38-8100-400d-9e53-2dbfcafd5f48';

export interface Category { id: number; name: string; sort_order: number; is_active: boolean; }
export interface FormField {
  id?: number;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  sort_order: number;
}
export interface Product {
  id: number;
  category_id: number | null;
  name: string;
  description: string;
  price: number;
  photo_url: string;
  payment_url: string;
  is_active: boolean;
  sort_order: number;
}
export interface Order {
  id: number;
  product_name: string;
  price: number;
  status: string;
  created_at: string;
  form_data: Record<string, string>;
}

const emptyProduct = (categoryId?: number): Omit<Product, 'id'> => ({
  category_id: categoryId ?? null,
  name: '', description: '', price: 0,
  photo_url: '', payment_url: '',
  is_active: true, sort_order: 0,
});

export const useShopAdmin = () => {
  const { toast } = useToast();
  const [view, setView] = useState<'categories' | 'products' | 'orders' | 'archive'>('categories');

  // categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [savingCat, setSavingCat] = useState(false);
  const [catsLoading, setCatsLoading] = useState(false);

  // products
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // product form
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct());
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // fields editor
  const [showFieldsEditor, setShowFieldsEditor] = useState(false);
  const [fieldsProduct, setFieldsProduct] = useState<Product | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [savingFields, setSavingFields] = useState(false);
  const [allFields, setAllFields] = useState<FormField[]>([]);
  const [showFieldPicker, setShowFieldPicker] = useState(false);

  // ── loaders ────────────────────────────────────────────────────────────────
  const loadCategories = async () => {
    setCatsLoading(true);
    try {
      const res = await fetch(`${PRODUCTS_URL}?action=categories`);
      const data = await res.json();
      setCategories((data.categories || []).filter((c: Category & { name: string }) => c.name !== '__deleted__'));
    } catch { setCategories([]); }
    finally { setCatsLoading(false); }
  };

  const loadProducts = async (catId: string) => {
    setProductsLoading(true);
    try {
      const res = await fetch(`${PRODUCTS_URL}?action=list&category_id=${catId}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch { setProducts([]); }
    finally { setProductsLoading(false); }
  };

  const loadOrders = async (catId: string) => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`${ORDERS_URL}?category_id=${catId}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch { setOrders([]); }
    finally { setOrdersLoading(false); }
  };

  useEffect(() => { loadCategories(); }, []);

  useEffect(() => {
    if (!selectedCatId) return;
    if (view === 'products') loadProducts(selectedCatId);
    if (view === 'orders' || view === 'archive') loadOrders(selectedCatId);
  }, [selectedCatId, view]);

  // ── category CRUD ──────────────────────────────────────────────────────────
  const createCategory = async () => {
    if (!newCatName.trim()) return;
    setSavingCat(true);
    try {
      const res = await fetch(`${PRODUCTS_URL}?action=category_create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim(), sort_order: categories.length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCategories(cs => [...cs, data.category]);
      setNewCatName('');
      toast({ title: 'Раздел создан' });
    } catch (e: unknown) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    } finally { setSavingCat(false); }
  };

  const saveCategory = async (cat: Category, name: string) => {
    setSavingCat(true);
    try {
      const res = await fetch(`${PRODUCTS_URL}?action=category_update&id=${cat.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
      setCategories(cs => cs.map(c => c.id === cat.id ? { ...c, name } : c));
      setEditingCat(null);
      toast({ title: 'Раздел сохранён' });
    } catch {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' });
    } finally { setSavingCat(false); }
  };

  const deleteCategory = async (cat: Category) => {
    if (!confirm(`Удалить раздел «${cat.name}»? Товары останутся без раздела.`)) return;
    await fetch(`${PRODUCTS_URL}?action=category_delete&id=${cat.id}`, { method: 'PUT' });
    setCategories(cs => cs.filter(c => c.id !== cat.id));
    if (selectedCatId === String(cat.id)) setSelectedCatId('');
    toast({ title: 'Раздел удалён' });
  };

  const toggleCategoryActive = async (cat: Category) => {
    const nextActive = !cat.is_active;
    setCategories(cs => cs.map(c => c.id === cat.id ? { ...c, is_active: nextActive } : c));
    try {
      const res = await fetch(`${PRODUCTS_URL}?action=category_update&id=${cat.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextActive }),
      });
      if (!res.ok) throw new Error();
      toast({ title: nextActive ? 'Раздел показан на витрине' : 'Раздел скрыт с витрины' });
    } catch {
      setCategories(cs => cs.map(c => c.id === cat.id ? { ...c, is_active: !nextActive } : c));
      toast({ title: 'Ошибка изменения видимости', variant: 'destructive' });
    }
  };

  // ── product CRUD ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyProduct(Number(selectedCatId) || undefined));
    setShowForm(true);
  };
  const openEdit = (p: Product) => { setEditingProduct(p); setForm({ ...p }); setShowForm(true); };

  const saveProduct = async () => {
    if (!form.name.trim()) return toast({ title: 'Укажите название товара', variant: 'destructive' });
    setSavingProduct(true);
    try {
      let res: Response;
      if (editingProduct) {
        res = await fetch(`${PRODUCTS_URL}?action=update&id=${editingProduct.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
      } else {
        res = await fetch(`${PRODUCTS_URL}?action=create`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: editingProduct ? 'Товар обновлён' : 'Товар создан' });
      setShowForm(false);
      if (selectedCatId) loadProducts(selectedCatId);
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_base64: b64, file_name: file.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm(f => ({ ...f, photo_url: data.photo_url }));
      setProducts(ps => ps.map(p => p.id === productId ? { ...p, photo_url: data.photo_url } : p));
      toast({ title: 'Фото загружено' });
    } catch (e: unknown) {
      toast({ title: 'Ошибка загрузки фото', description: (e as Error).message, variant: 'destructive' });
    } finally { setUploadingPhoto(false); }
  };

  // ── fields editor ──────────────────────────────────────────────────────────
  const openFieldsEditor = async (p: Product) => {
    setFieldsProduct(p);
    try {
      const [resFields, resAll] = await Promise.all([
        fetch(`${PRODUCTS_URL}?action=fields&product_id=${p.id}`),
        fetch(`${PRODUCTS_URL}?action=all_fields`),
      ]);
      const [dataFields, dataAll] = await Promise.all([resFields.json(), resAll.json()]);
      setFields(dataFields.fields || []);
      setAllFields((dataAll.fields || []).filter((f: FormField) => f.field_label));
    } catch { setFields([]); setAllFields([]); }
    setShowFieldsEditor(true);
  };
  const addField = () => setFields(fs => [...fs, { field_name: '', field_label: '', field_type: 'text', is_required: false, sort_order: fs.length }]);
  const addFieldFromTemplate = (f: FormField) => {
    setFields(fs => [...fs, { field_name: f.field_name, field_label: f.field_label, field_type: f.field_type, is_required: f.is_required, sort_order: fs.length }]);
    setShowFieldPicker(false);
  };
  const updateField = (i: number, key: keyof FormField, val: string | boolean | number) =>
    setFields(fs => fs.map((f, idx) => idx === i ? { ...f, [key]: val } : f));
  const removeField = (i: number) => setFields(fs => fs.filter((_, idx) => idx !== i));
  const saveFields = async () => {
    if (!fieldsProduct) return;
    setSavingFields(true);
    try {
      const res = await fetch(`${PRODUCTS_URL}?action=save_fields&product_id=${fieldsProduct.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFields(data.fields || []);
      toast({ title: 'Поля формы сохранены' });
    } catch (e: unknown) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    } finally { setSavingFields(false); }
  };

  // ── copy product ───────────────────────────────────────────────────────────
  const copyProduct = async (p: Product) => {
    const copy = { ...p, name: `${p.name} (копия)`, sort_order: p.sort_order + 1 };
    const { id: _id, ...body } = copy;
    try {
      const res = await fetch(`${PRODUCTS_URL}?action=create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts(ps => {
        const idx = ps.findIndex(x => x.id === p.id);
        const next = [...ps];
        next.splice(idx + 1, 0, data.product);
        return next;
      });
      toast({ title: 'Товар скопирован' });
    } catch {
      toast({ title: 'Ошибка копирования', variant: 'destructive' });
    }
  };

  // ── delete product ─────────────────────────────────────────────────────────
  const deleteProduct = async (p: Product) => {
    if (!confirm(`Удалить товар «${p.name}»?`)) return;
    try {
      await fetch(`${PRODUCTS_URL}?action=remove&id=${p.id}`, { method: 'PUT' });
      setProducts(ps => ps.filter(x => x.id !== p.id));
      toast({ title: 'Товар удалён' });
    } catch {
      toast({ title: 'Ошибка удаления', variant: 'destructive' });
    }
  };

  // ── orders ─────────────────────────────────────────────────────────────────
  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await fetch(`${ORDERS_URL}?id=${orderId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setOrders(os => os.map(o => o.id === orderId ? { ...o, status } : o));
    } catch { toast({ title: 'Ошибка обновления статуса', variant: 'destructive' }); }
  };

  const deleteOrder = async (orderId: number) => {
    if (!confirm('Удалить заказ?')) return;
    try {
      await fetch(`${ORDERS_URL}?action=remove&id=${orderId}`, { method: 'PUT' });
      setOrders(os => os.filter(o => o.id !== orderId));
      toast({ title: 'Заказ удалён' });
    } catch {
      toast({ title: 'Ошибка удаления', variant: 'destructive' });
    }
  };

  const exportToExcel = (list: Order[], filename: string) => {
    if (list.length === 0) { toast({ title: 'Нет данных для экспорта', variant: 'destructive' }); return; }
    const formKeys = Array.from(new Set(list.flatMap(o => Object.keys(o.form_data || {}))));
    const headers = ['№', 'Товар', 'Цена', 'Статус', 'Дата', ...formKeys];
    const rows = list.map(o => [
      o.id, o.product_name, Number(o.price).toLocaleString('ru-RU'),
      ({ new: 'Новый', paid: 'Оплачен', cancelled: 'Отменён', completed: 'Выполнен' } as Record<string, string>)[o.status] || o.status,
      new Date(o.created_at).toLocaleString('ru-RU'),
      ...formKeys.map(k => o.form_data?.[k] || ''),
    ]);
    const csv = [headers, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.csv`;
    a.click();
  };

  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');

  return {
    view, setView,
    categories, selectedCatId, setSelectedCatId, editingCat, setEditingCat, newCatName, setNewCatName, savingCat, catsLoading,
    products, productsLoading,
    orders, ordersLoading,
    showForm, setShowForm, editingProduct, form, setForm, savingProduct, uploadingPhoto,
    showFieldsEditor, setShowFieldsEditor, fieldsProduct, fields, savingFields, allFields, showFieldPicker, setShowFieldPicker,
    createCategory, saveCategory, deleteCategory, toggleCategoryActive,
    openCreate, openEdit, saveProduct, uploadPhoto,
    openFieldsEditor, addField, addFieldFromTemplate, updateField, removeField, saveFields,
    copyProduct, deleteProduct,
    updateOrderStatus, deleteOrder, exportToExcel,
    activeOrders,
  };
};
