import { useState, useCallback } from 'react';

interface JuryMember {
  id: number;
  name: string;
  role: string;
  specialty: string;
  bio: string;
  image_url: string | null;
  sort_order: number;
  login?: string | null;
}

interface JuryFormData {
  name: string;
  role: string;
  specialty: string;
  bio: string;
  image_url: string;
  sort_order: number;
}

export const useAdminJury = () => {
  const [juryMembers, setJuryMembers] = useState<JuryMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateJuryModal, setShowCreateJuryModal] = useState(false);
  const [showEditJuryModal, setShowEditJuryModal] = useState(false);
  const [selectedJuryMember, setSelectedJuryMember] = useState<JuryMember | null>(null);
  const [juryFormData, setJuryFormData] = useState<JuryFormData>({
    name: '',
    role: '',
    specialty: '',
    bio: '',
    image_url: '',
    sort_order: 0
  });

  const loadJuryMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/29a5a3ab-7964-41f0-baf5-d85b81b743bc');
      const data = await response.json();
      setJuryMembers(data.jury_members || []);
    } catch (error) {
      console.error('Ошибка загрузки жюри:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateJuryMember = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/29a5a3ab-7964-41f0-baf5-d85b81b743bc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(juryFormData)
      });
      
      if (response.ok) {
        setShowCreateJuryModal(false);
        setJuryFormData({ name: '', role: '', specialty: '', bio: '', image_url: '', sort_order: 0 });
        loadJuryMembers();
      }
    } catch (error) {
      console.error('Ошибка создания члена жюри:', error);
    }
  };

  const handleEditJuryMember = async () => {
    if (!selectedJuryMember) return;
    
    try {
      const response = await fetch('https://functions.poehali.dev/29a5a3ab-7964-41f0-baf5-d85b81b743bc', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedJuryMember.id, ...juryFormData })
      });
      
      if (response.ok) {
        setShowEditJuryModal(false);
        setSelectedJuryMember(null);
        setJuryFormData({ name: '', role: '', specialty: '', bio: '', image_url: '', sort_order: 0 });
        loadJuryMembers();
      }
    } catch (error) {
      console.error('Ошибка обновления члена жюри:', error);
    }
  };

  const handleDeleteJuryMember = async (memberId: number) => {
    if (!confirm('Удалить члена жюри?')) return;
    
    try {
      const response = await fetch(`https://functions.poehali.dev/29a5a3ab-7964-41f0-baf5-d85b81b743bc?id=${memberId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadJuryMembers();
      }
    } catch (error) {
      console.error('Ошибка удаления члена жюри:', error);
    }
  };

  const openEditJuryModal = (member: JuryMember) => {
    setSelectedJuryMember(member);
    setJuryFormData({
      name: member.name,
      role: member.role,
      specialty: member.specialty,
      bio: member.bio,
      image_url: member.image_url || '',
      sort_order: member.sort_order
    });
    setShowEditJuryModal(true);
  };

  const handleCreateJuryClick = () => {
    setJuryFormData({ name: '', role: '', specialty: '', bio: '', image_url: '', sort_order: 0 });
    setShowCreateJuryModal(true);
  };

  const handleSetJuryCredentials = async (juryId: number, login: string, password: string) => {
    try {
      const response = await fetch('https://functions.poehali.dev/29a5a3ab-7964-41f0-baf5-d85b81b743bc', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: juryId,
          login,
          password
        })
      });

      if (response.ok) {
        alert('Доступ для члена жюри успешно настроен!');
        loadJuryMembers();
      } else {
        alert('Ошибка при настройке доступа');
      }
    } catch (error) {
      console.error('Ошибка настройки доступа жюри:', error);
      alert('Ошибка при настройке доступа');
    }
  };

  return {
    juryMembers,
    loading,
    showCreateJuryModal,
    showEditJuryModal,
    selectedJuryMember,
    juryFormData,
    setJuryFormData,
    loadJuryMembers,
    handleCreateJuryMember,
    handleEditJuryMember,
    handleDeleteJuryMember,
    openEditJuryModal,
    handleCreateJuryClick,
    handleSetJuryCredentials,
    setShowCreateJuryModal,
    setShowEditJuryModal
  };
};