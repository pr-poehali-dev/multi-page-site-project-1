import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

type Concert = {
  id: number;
  title: string;
  description: string;
  poster_url?: string;
  ticket_link?: string;
  details_link?: string;
  location?: string;
  event_date?: string;
  status: string;
};

type ConcertFormData = {
  title: string;
  description: string;
  poster_url?: string;
  ticket_link?: string;
  details_link?: string;
  location?: string;
  event_date?: string;
  status: string;
};

const API_URL = 'https://functions.poehali.dev/de057f50-7d1e-49bc-a61f-f23335190f32';

export const useAdminConcerts = () => {
  const { toast } = useToast();
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedConcert, setSelectedConcert] = useState<Concert | null>(null);
  const [formData, setFormData] = useState<ConcertFormData>({
    title: '',
    description: '',
    poster_url: '',
    ticket_link: '',
    details_link: '',
    location: '',
    event_date: '',
    status: 'upcoming',
  });

  const loadConcerts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setConcerts(data.concerts || []);
    } catch (error) {
      console.error('Ошибка загрузки концертов:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить концерты',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleCreateConcert = async () => {
    if (!formData.title) {
      toast({
        title: 'Ошибка',
        description: 'Название обязательно',
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
          description: 'Концерт создан',
        });
        setShowCreateModal(false);
        loadConcerts();
        setFormData({
          title: '',
          description: '',
          poster_url: '',
          ticket_link: '',
          details_link: '',
          location: '',
          event_date: '',
          status: 'upcoming',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать концерт',
        variant: 'destructive',
      });
    }
  };

  const handleEditConcert = async () => {
    if (!selectedConcert) return;

    try {
      const response = await fetch(`${API_URL}?id=${selectedConcert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Успешно',
          description: 'Концерт обновлён',
        });
        setShowEditModal(false);
        loadConcerts();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить концерт',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConcert = async (concertId: number) => {
    try {
      const response = await fetch(`${API_URL}?id=${concertId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Успешно',
          description: 'Концерт удалён',
        });
        loadConcerts();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить концерт',
        variant: 'destructive',
      });
    }
  };

  const openEditModal = (concert: Concert) => {
    setSelectedConcert(concert);
    setFormData({
      title: concert.title,
      description: concert.description,
      poster_url: concert.poster_url || '',
      ticket_link: concert.ticket_link || '',
      details_link: concert.details_link || '',
      location: concert.location || '',
      event_date: concert.event_date || '',
      status: concert.status,
    });
    setShowEditModal(true);
  };

  const handleCreateClick = () => {
    setFormData({
      title: '',
      description: '',
      poster_url: '',
      ticket_link: '',
      details_link: '',
      location: '',
      event_date: '',
      status: 'upcoming',
    });
    setShowCreateModal(true);
  };

  return {
    concerts,
    loading,
    showCreateModal,
    showEditModal,
    selectedConcert,
    formData,
    setFormData,
    loadConcerts,
    handleCreateConcert,
    handleEditConcert,
    handleDeleteConcert,
    openEditModal,
    handleCreateClick,
    setShowCreateModal,
    setShowEditModal,
  };
};
