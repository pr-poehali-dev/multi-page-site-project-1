import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import ApplicationsTab from '@/components/admin/ApplicationsTab';
import ContestsTab from '@/components/admin/ContestsTab';
import ContestModal from '@/components/admin/ContestModal';

interface Application {
  id: number;
  participant_id: number;
  contest_id: number;
  status: string;
  submitted_at: string;
}

interface Contest {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
}

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<'applications' | 'contests'>('applications');
  const [applications, setApplications] = useState<Application[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contestFilter, setContestFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'upcoming'
  });

  useEffect(() => {
    if (activeTab === 'applications') {
      loadApplications();
    } else {
      loadContests();
    }
  }, [statusFilter, contestFilter, activeTab]);

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
        loadApplications();
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
  };

  const loadContests = async () => {
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
  };

  const handleCreateContest = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowCreateModal(false);
        setFormData({ title: '', description: '', start_date: '', end_date: '', status: 'upcoming' });
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
        setFormData({ title: '', description: '', start_date: '', end_date: '', status: 'upcoming' });
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
      status: contest.status
    });
    setShowEditModal(true);
  };

  const handleCreateClick = () => {
    setFormData({ title: '', description: '', start_date: '', end_date: '', status: 'upcoming' });
    setShowCreateModal(true);
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-heading font-bold mb-2">
              Админ-панель жюри
            </h1>
            <p className="text-muted-foreground">
              Управление заявками и конкурсами
            </p>
            
            <div className="flex gap-4 mt-6">
              <Button
                variant={activeTab === 'applications' ? 'default' : 'outline'}
                onClick={() => setActiveTab('applications')}
                className={activeTab === 'applications' ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                <Icon name="FileText" size={18} className="mr-2" />
                Заявки
              </Button>
              <Button
                variant={activeTab === 'contests' ? 'default' : 'outline'}
                onClick={() => setActiveTab('contests')}
                className={activeTab === 'contests' ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                <Icon name="Trophy" size={18} className="mr-2" />
                Конкурсы
              </Button>
            </div>
          </div>

          {activeTab === 'applications' && (
            <ApplicationsTab
              applications={applications}
              loading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              contestFilter={contestFilter}
              setContestFilter={setContestFilter}
              updateStatus={updateStatus}
            />
          )}

          {activeTab === 'contests' && (
            <ContestsTab
              contests={contests}
              loading={loading}
              onCreateClick={handleCreateClick}
              onEditClick={openEditModal}
              onDeleteClick={handleDeleteContest}
            />
          )}

          <ContestModal
            show={showCreateModal}
            mode="create"
            formData={formData}
            setFormData={setFormData}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateContest}
          />

          <ContestModal
            show={showEditModal}
            mode="edit"
            formData={formData}
            setFormData={setFormData}
            onClose={() => setShowEditModal(false)}
            onSubmit={handleEditContest}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminPage;
