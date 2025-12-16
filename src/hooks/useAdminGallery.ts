import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

interface GalleryItem {
  id: number;
  title: string;
  description: string;
  file_url: string;
  thumbnail_url?: string;
  media_type: 'photo' | 'video';
  contest_id?: number;
  display_order: number;
  is_featured: boolean;
  created_at: string;
}

const ADMIN_GALLERY_URL = 'https://functions.poehali.dev/27d46d11-5402-4428-b786-4d2eb3aace8b/gallery';

export function useAdminGallery() {
  const { toast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const loadGallery = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(ADMIN_GALLERY_URL);
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error loading gallery:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить галерею',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const uploadFile = async (fileData: {
    title: string;
    description: string;
    media_type: 'photo' | 'video';
    contest_id?: number;
    is_featured: boolean;
    file_base64: string;
    file_name: string;
  }) => {
    try {
      const response = await fetch(ADMIN_GALLERY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileData)
      });

      if (!response.ok) throw new Error('Upload failed');

      toast({
        title: 'Успешно',
        description: 'Файл загружен в галерею'
      });

      await loadGallery();
      return true;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить файл',
        variant: 'destructive'
      });
      return false;
    }
  };

  const updateItem = async (id: number, updates: Partial<GalleryItem>) => {
    try {
      const response = await fetch(`${ADMIN_GALLERY_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Update failed');

      toast({
        title: 'Успешно',
        description: 'Элемент обновлен'
      });

      await loadGallery();
      return true;
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить элемент',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteItem = async (id: number) => {
    try {
      const response = await fetch(`${ADMIN_GALLERY_URL}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Delete failed');

      toast({
        title: 'Успешно',
        description: 'Элемент удален'
      });

      await loadGallery();
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить элемент',
        variant: 'destructive'
      });
      return false;
    }
  };

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  return {
    items,
    loading,
    showUploadModal,
    setShowUploadModal,
    loadGallery,
    uploadFile,
    updateItem,
    deleteItem
  };
}
