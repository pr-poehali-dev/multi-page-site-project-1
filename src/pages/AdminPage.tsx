import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import ApplicationsTab from '@/components/admin/ApplicationsTab';
import ContestsTab from '@/components/admin/ContestsTab';
import ContestModal from '@/components/admin/ContestModal';
import JuryTab from '@/components/admin/JuryTab';
import JuryModal from '@/components/admin/JuryModal';
import JuryAccountsTab from '@/components/admin/JuryAccountsTab';
import AdminAuth from '@/components/admin/AdminAuth';
import { useAdminApplications } from '@/hooks/useAdminApplications';
import { useAdminContests } from '@/hooks/useAdminContests';
import { useAdminJury } from '@/hooks/useAdminJury';
import { useAdminScoring } from '@/hooks/useAdminScoring';
import ScoringTab from '@/components/admin/ScoringTab';
import { useToast } from '@/hooks/use-toast';

const AdminPage = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'applications' | 'contests' | 'jury' | 'jury-accounts' | 'scoring'>('applications');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contestFilter, setContestFilter] = useState('all');

  const { participants, loading: scoringLoading, selectedContest: scoringSelectedContest, handleContestChange, exportProtocol } = useAdminScoring();

  const { applications, loading: applicationsLoading, updateStatus } = useAdminApplications(statusFilter, contestFilter);
  
  const handleUpdateStatus = async (applicationId: number, newStatus: string) => {
    const result = await updateStatus(applicationId, newStatus);
    if (result) {
      if (newStatus === 'approved') {
        toast({
          title: 'Заявка одобрена',
          description: result.message || 'Участник добавлен в систему оценивания',
        });
      } else if (newStatus === 'rejected') {
        toast({
          title: 'Заявка отклонена',
          description: 'Статус заявки успешно обновлен',
          variant: 'destructive'
        });
      }
    }
  };

  const {
    contests,
    loading: contestsLoading,
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
  } = useAdminContests();

  const {
    juryMembers,
    loading: juryLoading,
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
  } = useAdminJury();

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'contests' || activeTab === 'scoring') {
        loadContests();
      }
      if (activeTab === 'jury' || activeTab === 'jury-accounts') {
        loadJuryMembers();
      }
    }
  }, [activeTab, isAuthenticated]);

  if (!isAuthenticated) {
    return <AdminAuth onLogin={handleLogin} />;
  }

  const loading = activeTab === 'applications' ? applicationsLoading : 
                  activeTab === 'contests' ? contestsLoading : 
                  activeTab === 'scoring' ? scoringLoading :
                  juryLoading;

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold mb-2">
                  Админ-панель жюри
                </h1>
                <p className="text-muted-foreground">
                  Управление заявками и конкурсами
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="gap-2"
              >
                <Icon name="LogOut" size={18} />
                Выйти
              </Button>
            </div>
            
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
              <Button
                variant={activeTab === 'jury' ? 'default' : 'outline'}
                onClick={() => setActiveTab('jury')}
                className={activeTab === 'jury' ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                <Icon name="Users" size={18} className="mr-2" />
                Жюри
              </Button>
              <Button
                variant={activeTab === 'jury-accounts' ? 'default' : 'outline'}
                onClick={() => setActiveTab('jury-accounts')}
                className={activeTab === 'jury-accounts' ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                <Icon name="Key" size={18} className="mr-2" />
                Доступы жюри
              </Button>
              <Button
                variant={activeTab === 'scoring' ? 'default' : 'outline'}
                onClick={() => setActiveTab('scoring')}
                className={activeTab === 'scoring' ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                <Icon name="BarChart3" size={18} className="mr-2" />
                Протокол оценок
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
              updateStatus={handleUpdateStatus}
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

          {activeTab === 'jury' && (
            <JuryTab
              juryMembers={juryMembers}
              loading={loading}
              onCreateClick={handleCreateJuryClick}
              onEditClick={openEditJuryModal}
              onDeleteClick={handleDeleteJuryMember}
            />
          )}

          {activeTab === 'jury-accounts' && (
            <JuryAccountsTab
              juryMembers={juryMembers}
              loading={loading}
              onSetCredentials={handleSetJuryCredentials}
            />
          )}

          {activeTab === 'scoring' && (
            <ScoringTab
              contests={contests}
              selectedContest={scoringSelectedContest}
              participants={participants}
              loading={loading}
              onContestChange={handleContestChange}
              onExportProtocol={exportProtocol}
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

          <JuryModal
            show={showCreateJuryModal}
            mode="create"
            formData={juryFormData}
            setFormData={setJuryFormData}
            onClose={() => setShowCreateJuryModal(false)}
            onSubmit={handleCreateJuryMember}
          />

          <JuryModal
            show={showEditJuryModal}
            mode="edit"
            formData={juryFormData}
            setFormData={setJuryFormData}
            onClose={() => setShowEditJuryModal(false)}
            onSubmit={handleEditJuryMember}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminPage;