import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

type Partner = {
  id: number;
  name: string;
  logo_url: string;
  website_url?: string;
  display_order: number;
  is_active: boolean;
};

type PartnerFormData = {
  name: string;
  logo_url: string;
  website_url: string;
  display_order: number;
  is_active: boolean;
};

const API_URL = 'https://functions.poehali.dev/7b3c1e0e-bd68-4b73-9377-740689560912';

export const useAdminPartners = () => {
  const { toast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState<PartnerFormData>({
    name: '',
    logo_url: '',
    website_url: '',
    display_order: 0,
    is_active: true,
  });

  const loadPartners = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?active=false`);
      const data = await response.json();
      setPartners(data.partners || []);
    } catch (error) {
      console.error('Ошибка загрузки партнёров:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить партнёров',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleCreatePartner = async () => {
    if (!formData.name || !formData.logo_url) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Успешно',
          description: 'Партнёр добавлен',
        });
        setShowCreateModal(false);
        loadPartners();
        setFormData({
          name: '',
          logo_url: '',
          website_url: '',
          display_order: 0,
          is_active: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить партнёра',
        variant: 'destructive',
      });
    }
  };

  const handleEditPartner = async () => {
    if (!selectedPartner) return;

    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPartner.id, ...formData }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Успешно',
          description: 'Партнёр обновлён',
        });
        setShowEditModal(false);
        loadPartners();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить партнёра',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePartner = async (partnerId: number) => {
    try {
      const response = await fetch(`${API_URL}?id=${partnerId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Успешно',
          description: 'Партнёр удалён',
        });
        loadPartners();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить партнёра',
        variant: 'destructive',
      });
    }
  };

  const openEditModal = (partner: Partner) => {
    setSelectedPartner(partner);
    setFormData({
      name: partner.name,
      logo_url: partner.logo_url || '',
      website_url: partner.website_url || '',
      display_order: partner.display_order,
      is_active: partner.is_active,
    });
    setShowEditModal(true);
  };

  const handleCreateClick = () => {
    setFormData({
      name: '',
      logo_url: '',
      website_url: '',
      display_order: 0,
      is_active: true,
    });
    setShowCreateModal(true);
  };

  return {
    partners,
    loading,
    showCreateModal,
    showEditModal,
    selectedPartner,
    formData,
    setFormData,
    loadPartners,
    handleCreatePartner,
    handleEditPartner,
    handleDeletePartner,
    openEditModal,
    handleCreateClick,
    setShowCreateModal,
    setShowEditModal,
  };
};
