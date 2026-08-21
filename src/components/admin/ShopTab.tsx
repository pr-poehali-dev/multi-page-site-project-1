import { useShopAdmin } from '@/hooks/useShopAdmin';
import ShopFieldsEditor from './ShopFieldsEditor';
import ShopProductForm from './ShopProductForm';
import ShopProductsView from './ShopProductsView';
import ShopOrdersView from './ShopOrdersView';
import ShopTabHeader from './ShopTabHeader';
import ShopCategoriesView from './ShopCategoriesView';

interface ContestOption { id: number; title: string; }

interface ShopTabProps {
  contests: ContestOption[];
}

const ShopTab = ({ contests }: ShopTabProps) => {
  const {
    view, setView,
    categories, selectedCatId, setSelectedCatId, editingCat, setEditingCat, newCatName, setNewCatName, savingCat, catsLoading,
    products, productsLoading,
    orders, ordersLoading,
    showForm, setShowForm, editingProduct, form, setForm, savingProduct, uploadingPhoto,
    showFieldsEditor, setShowFieldsEditor, fieldsProduct, fields, savingFields, allFields, showFieldPicker, setShowFieldPicker,
    createCategory, saveCategory, deleteCategory, toggleCategoryActive, setCategoryContest,
    openCreate, openEdit, saveProduct, uploadPhoto,
    openFieldsEditor, addField, addFieldFromTemplate, updateField, removeField, saveFields,
    copyProduct, deleteProduct,
    updateOrderStatus, deleteOrder, exportToExcel,
    activeOrders,
  } = useShopAdmin();

  // ══ RENDER ══════════════════════════════════════════════════════════════════

  if (showFieldsEditor && fieldsProduct) return (
    <ShopFieldsEditor
      fieldsProduct={fieldsProduct}
      fields={fields}
      allFields={allFields}
      savingFields={savingFields}
      showFieldPicker={showFieldPicker}
      onBack={() => setShowFieldsEditor(false)}
      onAddField={addField}
      onAddFieldFromTemplate={addFieldFromTemplate}
      onUpdateField={updateField}
      onRemoveField={removeField}
      onSaveFields={saveFields}
      onToggleFieldPicker={() => setShowFieldPicker(v => !v)}
    />
  );

  if (showForm) return (
    <ShopProductForm
      editingProduct={editingProduct}
      form={form}
      categories={categories}
      savingProduct={savingProduct}
      uploadingPhoto={uploadingPhoto}
      onBack={() => setShowForm(false)}
      onFormChange={setForm}
      onSave={saveProduct}
      onUploadPhoto={uploadPhoto}
      onOpenFieldsEditor={openFieldsEditor}
    />
  );

  return (
    <div>
      <ShopTabHeader view={view} onChangeView={setView} activeOrdersCount={activeOrders.length} />

      {/* ── CATEGORIES ── */}
      {view === 'categories' && (
        <ShopCategoriesView
          categories={categories}
          contests={contests}
          catsLoading={catsLoading}
          editingCat={editingCat}
          setEditingCat={setEditingCat}
          newCatName={newCatName}
          setNewCatName={setNewCatName}
          savingCat={savingCat}
          onCreateCategory={createCategory}
          onSaveCategory={saveCategory}
          onDeleteCategory={deleteCategory}
          onToggleCategoryActive={toggleCategoryActive}
          onSetCategoryContest={setCategoryContest}
        />
      )}

      {/* ── PRODUCTS ── */}
      {view === 'products' && (
        <ShopProductsView
          products={products}
          categories={categories}
          selectedCatId={selectedCatId}
          productsLoading={productsLoading}
          onSelectCategory={setSelectedCatId}
          onOpenCreate={openCreate}
          onOpenEdit={openEdit}
          onOpenFieldsEditor={openFieldsEditor}
          onCopyProduct={copyProduct}
          onDeleteProduct={deleteProduct}
        />
      )}

      {/* ── ORDERS & ARCHIVE ── */}
      {(view === 'orders' || view === 'archive') && (
        <ShopOrdersView
          view={view}
          orders={orders}
          categories={categories}
          selectedCatId={selectedCatId}
          ordersLoading={ordersLoading}
          onSelectCategory={setSelectedCatId}
          onUpdateOrderStatus={updateOrderStatus}
          onDeleteOrder={deleteOrder}
          onExportToExcel={exportToExcel}
        />
      )}
    </div>
  );
};

export default ShopTab;