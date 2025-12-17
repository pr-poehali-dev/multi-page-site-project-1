import { useEffect, useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import ApplicationsTab from '@/components/admin/ApplicationsTab';
import ContestsTab from '@/components/admin/ContestsTab';
import ConcertsManagementTab from '@/components/admin/ConcertsManagementTab';
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
import GalleryTab from '@/components/admin/GalleryTab';
import GalleryUploadModal from '@/components/admin/GalleryUploadModal';
import { useAdminGallery } from '@/hooks/useAdminGallery';
import { useAdminConcerts } from '@/hooks/useAdminConcerts';
import ConcertModal from '@/components/admin/ConcertModal';
import { useAdminResults } from '@/hooks/useAdminResults';
import ResultsManagementTab from '@/components/admin/ResultsManagementTab';
import ResultModal from '@/components/admin/ResultModal';
import { useAdminPartners } from '@/hooks/useAdminPartners';
import PartnersManagementTab from '@/components/admin/PartnersManagementTab';
import PartnerModal from '@/components/admin/PartnerModal';

const AdminPage = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'applications' | 'contests' | 'concerts' | 'jury' | 'jury-accounts' | 'scoring' | 'gallery' | 'results' | 'partners'>('applications');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contestFilter, setContestFilter] = useState('all');

  const { participants, loading: scoringLoading, selectedContest: scoringSelectedContest, handleContestChange, exportProtocol } = useAdminScoring();

  const { items: galleryItems, loading: galleryLoading, showUploadModal, setShowUploadModal, uploadFile, deleteItem } = useAdminGallery();

  const {
    concerts: managedConcerts,
    loading: concertsLoading,
    showCreateModal: showCreateConcertModal,
    showEditModal: showEditConcertModal,
    selectedConcert,
    formData: concertFormData,
    setFormData: setConcertFormData,
    loadConcerts,
    handleCreateConcert,
    handleEditConcert,
    handleDeleteConcert,
    openEditModal: openEditConcertModal,
    handleCreateClick: handleCreateConcertClick,
    setShowCreateModal: setShowCreateConcertModal,
    setShowEditModal: setShowEditConcertModal,
  } = useAdminConcerts();

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

  const handleDeleteApplication = async (applicationId: number) => {
    try {
      const response = await fetch(`https://functions.poehali.dev/27d46d11-5402-4428-b786-4d2eb3aace8b?id=${applicationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete application');
      }

      toast({
        title: 'Заявка удалена',
        description: 'Заявка и все связанные файлы успешно удалены',
      });

      // Обновляем список заявок
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить заявку',
        variant: 'destructive',
      });
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

  const {
    results,
    loading: resultsLoading,
    showCreateModal: showCreateResultModal,
    showEditModal: showEditResultModal,
    selectedResult,
    formData: resultFormData,
    setFormData: setResultFormData,
    loadResults,
    handleCreateResult,
    handleEditResult,
    handleDeleteResult,
    openEditModal: openEditResultModal,
    handleCreateClick: handleCreateResultClick,
    setShowCreateModal: setShowCreateResultModal,
    setShowEditModal: setShowEditResultModal,
  } = useAdminResults();

  const {
    partners,
    loading: partnersLoading,
    showCreateModal: showCreatePartnerModal,
    showEditModal: showEditPartnerModal,
    selectedPartner,
    formData: partnerFormData,
    setFormData: setPartnerFormData,
    loadPartners,
    handleCreatePartner,
    handleEditPartner,
    handleDeletePartner,
    openEditModal: openEditPartnerModal,
    handleCreateClick: handleCreatePartnerClick,
    setShowCreateModal: setShowCreatePartnerModal,
    setShowEditModal: setShowEditPartnerModal,
  } = useAdminPartners();

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const loading = useMemo(() => {
    switch (activeTab) {
      case 'applications': return applicationsLoading;
      case 'contests': return contestsLoading;
      case 'concerts': return concertsLoading;
      case 'scoring': return scoringLoading;
      case 'gallery': return galleryLoading;
      case 'results': return resultsLoading;
      case 'partners': return partnersLoading;
      default: return juryLoading;
    }
  }, [activeTab, applicationsLoading, contestsLoading, concertsLoading, scoringLoading, galleryLoading, resultsLoading, partnersLoading, juryLoading]);

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'contests' || activeTab === 'scoring' || activeTab === 'gallery') {
        loadContests();
      }
      if (activeTab === 'concerts') {
        loadConcerts();
      }
      if (activeTab === 'jury' || activeTab === 'jury-accounts') {
        loadJuryMembers();
      }
      if (activeTab === 'results') {
        loadResults();
      }
      if (activeTab === 'partners') {
        loadPartners();
      }
    }
  }, [activeTab, isAuthenticated, loadContests, loadConcerts, loadJuryMembers, loadResults, loadPartners]);

  if (!isAuthenticated) {
    return <AdminAuth onLogin={handleLogin} />;
  }

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
              <Button
                variant={activeTab === 'concerts' ? 'default' : 'outline'}
                onClick={() => setActiveTab('concerts')}
                className={activeTab === 'concerts' ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                <Icon name="Music" size={18} className="mr-2" />
                Концерты
              </Button>
              <Button
                variant={activeTab === 'gallery' ? 'default' : 'outline'}
                onClick={() => setActiveTab('gallery')}
                className={activeTab === 'gallery' ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                <Icon name="Image" size={18} className="mr-2" />
                Галерея
              </Button>
              <Button
                variant={activeTab === 'results' ? 'default' : 'outline'}
                onClick={() => setActiveTab('results')}
                className={activeTab === 'results' ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                <Icon name="Award" size={18} className="mr-2" />
                Итоги
              </Button>
              <Button
                variant={activeTab === 'partners' ? 'default' : 'outline'}
                onClick={() => setActiveTab('partners')}
                className={activeTab === 'partners' ? 'bg-secondary hover:bg-secondary/90' : ''}
              >
                <Icon name="Handshake" size={18} className="mr-2" />
                Партнёры
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
              deleteApplication={handleDeleteApplication}
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

          {activeTab === 'concerts' && (
            <ConcertsManagementTab
              concerts={managedConcerts}
              loading={loading}
              onCreateClick={handleCreateConcertClick}
              onEditClick={openEditConcertModal}
              onDeleteClick={handleDeleteConcert}
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

          {activeTab === 'gallery' && (
            <>
              <GalleryTab
                items={galleryItems}
                loading={loading}
                onUploadClick={() => setShowUploadModal(true)}
                onEditClick={(item) => console.log('Edit:', item)}
                onDeleteClick={deleteItem}
              />
              <GalleryUploadModal
                open={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSubmit={uploadFile}
                contests={contests}
              />
            </>
          )}

          {activeTab === 'results' && (
            <ResultsManagementTab
              results={results}
              loading={loading}
              onCreateClick={handleCreateResultClick}
              onEditClick={openEditResultModal}
              onDeleteClick={handleDeleteResult}
            />
          )}

          {activeTab === 'partners' && (
            <PartnersManagementTab
              partners={partners}
              loading={loading}
              onCreateClick={handleCreatePartnerClick}
              onEditClick={openEditPartnerModal}
              onDeleteClick={handleDeletePartner}
            />
          )}
          
          {activeTab === 'scoring' && console.log('[AdminPage] Rendering ScoringTab with:', { contests: contests.length, participants: participants.length })}

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
            contestId={selectedContest?.id}
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

          <ConcertModal
            show={showCreateConcertModal}
            mode="create"
            formData={concertFormData}
            setFormData={setConcertFormData}
            onClose={() => setShowCreateConcertModal(false)}
            onSubmit={handleCreateConcert}
          />

          <ConcertModal
            show={showEditConcertModal}
            mode="edit"
            formData={concertFormData}
            setFormData={setConcertFormData}
            onClose={() => setShowEditConcertModal(false)}
            onSubmit={handleEditConcert}
            concertId={selectedConcert?.id}
          />

          <ResultModal
            show={showCreateResultModal}
            mode="create"
            formData={resultFormData}
            setFormData={setResultFormData}
            onClose={() => setShowCreateResultModal(false)}
            onSubmit={handleCreateResult}
          />

          <ResultModal
            show={showEditResultModal}
            mode="edit"
            formData={resultFormData}
            setFormData={setResultFormData}
            onClose={() => setShowEditResultModal(false)}
            onSubmit={handleEditResult}
            resultId={selectedResult?.id}
          />

          <PartnerModal
            show={showCreatePartnerModal}
            mode="create"
            formData={partnerFormData}
            setFormData={setPartnerFormData}
            onClose={() => setShowCreatePartnerModal(false)}
            onSubmit={handleCreatePartner}
          />

          <PartnerModal
            show={showEditPartnerModal}
            mode="edit"
            formData={partnerFormData}
            setFormData={setPartnerFormData}
            onClose={() => setShowEditPartnerModal(false)}
            onSubmit={handleEditPartner}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminPage;