import { useState, useEffect } from 'react';

interface Application {
  id: number;
  participant_id: number;
  contest_id: number;
  status: string;
  submitted_at: string;
}

export const useAdminApplications = (statusFilter: string, contestFilter: string) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (contestFilter !== 'all') params.append('contest_id', contestFilter);

      const response = await fetch(
        `https://functions.poehali.dev/27d46d11-5402-4428-b786-4d2eb3aace8b?${params}`
      );
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (applicationId: number, newStatus: string) => {
    try {
      const response = await fetch(
        'https://functions.poehali.dev/27d46d11-5402-4428-b786-4d2eb3aace8b',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            application_id: applicationId,
            status: newStatus,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        loadApplications();
        return data;
      }
      return null;
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      return null;
    }
  };

  useEffect(() => {
    loadApplications();
  }, [statusFilter, contestFilter]);

  return {
    applications,
    loading,
    updateStatus,
    loadApplications
  };
};