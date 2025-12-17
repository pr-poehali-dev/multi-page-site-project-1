import { useEffect, useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AdminAuth from '@/components/admin/AdminAuth';
import { useAdminApplications } from '@/hooks/useAdminApplications';
import { useAdminContests } from '@/hooks/useAdminContests';
import { useAdminJury } from '@/hooks/useAdminJury';
import { useAdminScoring } from '@/hooks/useAdminScoring';
import { useToast } from '@/hooks/use-toast';
import { useAdminGallery } from '@/hooks/useAdminGallery';
import { useAdminConcerts } from '@/hooks/useAdminConcerts';
import { useAdminResults } from '@/hooks/useAdminResults';
import { useAdminPartners } from '@/hooks/useAdminPartners';
import AdminTabNavigation from '@/components/admin/AdminTabNavigation';
import AdminTabContent from '@/components/admin/AdminTabContent';
import AdminModalsContainer from '@/components/admin/AdminModalsContainer';

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
          <AdminTabNavigation 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            onLogout={handleLogout} 
          />

          <AdminTabContent
            activeTab={activeTab}
            loading={loading}
            applications={applications}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            contestFilter={contestFilter}
            setContestFilter={setContestFilter}
            contests={contests}
            handleUpdateStatus={handleUpdateStatus}
            handleDeleteApplication={handleDeleteApplication}
            handleCreateClick={handleCreateClick}
            openEditModal={openEditModal}
            handleDeleteContest={handleDeleteContest}
            managedConcerts={managedConcerts}
            handleCreateConcertClick={handleCreateConcertClick}
            openEditConcertModal={openEditConcertModal}
            handleDeleteConcert={handleDeleteConcert}
            juryMembers={juryMembers}
            handleCreateJuryClick={handleCreateJuryClick}
            openEditJuryModal={openEditJuryModal}
            handleDeleteJuryMember={handleDeleteJuryMember}
            handleSetJuryCredentials={handleSetJuryCredentials}
            participants={participants}
            scoringSelectedContest={scoringSelectedContest}
            handleContestChange={handleContestChange}
            exportProtocol={exportProtocol}
            galleryItems={galleryItems}
            setShowUploadModal={setShowUploadModal}
            deleteItem={deleteItem}
            results={results}
            handleCreateResultClick={handleCreateResultClick}
            openEditResultModal={openEditResultModal}
            handleDeleteResult={handleDeleteResult}
            partners={partners}
            handleCreatePartnerClick={handleCreatePartnerClick}
            openEditPartnerModal={openEditPartnerModal}
            handleDeletePartner={handleDeletePartner}
          />
        </div>
      </div>

      <AdminModalsContainer
        showCreateModal={showCreateModal}
        showEditModal={showEditModal}
        selectedContest={selectedContest}
        formData={formData}
        setFormData={setFormData}
        handleCreateContest={handleCreateContest}
        handleEditContest={handleEditContest}
        setShowCreateModal={setShowCreateModal}
        setShowEditModal={setShowEditModal}
        showCreateJuryModal={showCreateJuryModal}
        showEditJuryModal={showEditJuryModal}
        selectedJuryMember={selectedJuryMember}
        juryFormData={juryFormData}
        setJuryFormData={setJuryFormData}
        handleCreateJuryMember={handleCreateJuryMember}
        handleEditJuryMember={handleEditJuryMember}
        setShowCreateJuryModal={setShowCreateJuryModal}
        setShowEditJuryModal={setShowEditJuryModal}
        showUploadModal={showUploadModal}
        setShowUploadModal={setShowUploadModal}
        uploadFile={uploadFile}
        showCreateConcertModal={showCreateConcertModal}
        showEditConcertModal={showEditConcertModal}
        selectedConcert={selectedConcert}
        concertFormData={concertFormData}
        setConcertFormData={setConcertFormData}
        handleCreateConcert={handleCreateConcert}
        handleEditConcert={handleEditConcert}
        setShowCreateConcertModal={setShowCreateConcertModal}
        setShowEditConcertModal={setShowEditConcertModal}
        showCreateResultModal={showCreateResultModal}
        showEditResultModal={showEditResultModal}
        selectedResult={selectedResult}
        resultFormData={resultFormData}
        setResultFormData={setResultFormData}
        handleCreateResult={handleCreateResult}
        handleEditResult={handleEditResult}
        setShowCreateResultModal={setShowCreateResultModal}
        setShowEditResultModal={setShowEditResultModal}
        showCreatePartnerModal={showCreatePartnerModal}
        showEditPartnerModal={showEditPartnerModal}
        selectedPartner={selectedPartner}
        partnerFormData={partnerFormData}
        setPartnerFormData={setPartnerFormData}
        handleCreatePartner={handleCreatePartner}
        handleEditPartner={handleEditPartner}
        setShowCreatePartnerModal={setShowCreatePartnerModal}
        setShowEditPartnerModal={setShowEditPartnerModal}
      />

      <Footer />
    </div>
  );
};

export default AdminPage;