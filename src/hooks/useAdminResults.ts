import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

type ContestResult = {
  id: number;
  contest_id: number;
  title: string;
  description: string;
  pdf_url: string;
  published_date: string;
  contest_title?: string;
  start_date?: string;
  end_date?: string;
};

type ResultFormData = {
  contest_id: number;
  title: string;
  description: string;
  pdf_url: string;
  published_date: string;
};

const API_URL = 'https://functions.poehali.dev/7ff9bf2f-1648-49f2-9137-02fe1da936eb';

export const useAdminResults = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<ContestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ContestResult | null>(null);
  const [formData, setFormData] = useState<ResultFormData>({
    contest_id: 0,
    title: '',
    description: '',
    pdf_url: '',
    published_date: new Date().toISOString().split('T')[0],
  });

  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Ошибка загрузки итогов:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить итоги',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleCreateResult = async () => {
    if (!formData.title || !formData.contest_id) {
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
          description: 'Итоги опубликованы',
        });
        setShowCreateModal(false);
        loadResults();
        setFormData({
          contest_id: 0,
          title: '',
          description: '',
          pdf_url: '',
          published_date: new Date().toISOString().split('T')[0],
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось опубликовать итоги',
        variant: 'destructive',
      });
    }
  };

  const handleEditResult = async () => {
    if (!selectedResult) return;

    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedResult.id, ...formData }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Успешно',
          description: 'Итоги обновлены',
        });
        setShowEditModal(false);
        loadResults();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить итоги',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteResult = async (resultId: number) => {
    try {
      const response = await fetch(`${API_URL}?id=${resultId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Успешно',
          description: 'Итоги удалены',
        });
        loadResults();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить итоги',
        variant: 'destructive',
      });
    }
  };

  const openEditModal = (result: ContestResult) => {
    setSelectedResult(result);
    setFormData({
      contest_id: result.contest_id,
      title: result.title,
      description: result.description || '',
      pdf_url: result.pdf_url || '',
      published_date: result.published_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    });
    setShowEditModal(true);
  };

  const handleCreateClick = () => {
    setFormData({
      contest_id: 0,
      title: '',
      description: '',
      pdf_url: '',
      published_date: new Date().toISOString().split('T')[0],
    });
    setShowCreateModal(true);
  };

  return {
    results,
    loading,
    showCreateModal,
    showEditModal,
    selectedResult,
    formData,
    setFormData,
    loadResults,
    handleCreateResult,
    handleEditResult,
    handleDeleteResult,
    openEditModal,
    handleCreateClick,
    setShowCreateModal,
    setShowEditModal,
  };
};
