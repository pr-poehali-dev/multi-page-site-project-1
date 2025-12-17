import { useState, useCallback } from 'react';

interface Contest {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  rules?: string;
  prizes?: string;
  categories?: string;
  pdf_url?: string;
  poster_url?: string;
}

interface ContestFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  rules?: string;
  prizes?: string;
  categories?: string;
  pdf_url?: string;
  poster_url?: string;
}

export const useAdminContests = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [formData, setFormData] = useState<ContestFormData>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'upcoming',
    rules: '',
    prizes: '',
    categories: '',
    pdf_url: '',
    poster_url: ''
  });

  const loadContests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3');
      const data = await response.json();
      setContests(data.contests || []);
    } catch (error) {
      console.error('Ошибка загрузки конкурсов:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateContest = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowCreateModal(false);
        setFormData({ title: '', description: '', start_date: '', end_date: '', status: 'upcoming', rules: '', prizes: '', categories: '', pdf_url: '', poster_url: '' });
        loadContests();
      }
    } catch (error) {
      console.error('Ошибка создания конкурса:', error);
    }
  };

  const handleEditContest = async () => {
    if (!selectedContest) return;
    
    try {
      const response = await fetch('https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedContest.id, ...formData })
      });
      
      if (response.ok) {
        setShowEditModal(false);
        setSelectedContest(null);
        setFormData({ title: '', description: '', start_date: '', end_date: '', status: 'upcoming', rules: '', prizes: '', categories: '', pdf_url: '', poster_url: '' });
        loadContests();
      }
    } catch (error) {
      console.error('Ошибка обновления конкурса:', error);
    }
  };

  const handleDeleteContest = async (contestId: number) => {
    if (!confirm('Удалить конкурс?')) return;
    
    try {
      const response = await fetch(`https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3?id=${contestId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadContests();
      }
    } catch (error) {
      console.error('Ошибка удаления конкурса:', error);
    }
  };

  const openEditModal = (contest: Contest) => {
    setSelectedContest(contest);
    setFormData({
      title: contest.title,
      description: contest.description,
      start_date: contest.start_date.split('T')[0],
      end_date: contest.end_date.split('T')[0],
      status: contest.status,
      rules: contest.rules || '',
      prizes: contest.prizes || '',
      categories: contest.categories || '',
      pdf_url: contest.pdf_url || '',
      poster_url: contest.poster_url || ''
    });
    setShowEditModal(true);
  };

  const handleCreateClick = () => {
    setFormData({ title: '', description: '', start_date: '', end_date: '', status: 'upcoming', rules: '', prizes: '', categories: '', pdf_url: '' });
    setShowCreateModal(true);
  };

  return {
    contests,
    loading,
    showCreateModal,
    showEditModal,
    selectedContest,
    formData,
    setFormData,
    loadContests,
    handleCreateContest,
    handleEditContest,
    handleDeleteContest,
    openEditModal,
    handleCreateClick,
    setShowCreateModal,
    setShowEditModal
  };
};