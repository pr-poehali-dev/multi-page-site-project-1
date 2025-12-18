import ApplicationsTab from '@/components/admin/ApplicationsTab';
import ContestsTab from '@/components/admin/ContestsTab';
import ConcertsManagementTab from '@/components/admin/ConcertsManagementTab';
import JuryTab from '@/components/admin/JuryTab';
import JuryAccountsTab from '@/components/admin/JuryAccountsTab';
import ScoringTab from '@/components/admin/ScoringTab';
import GalleryTab from '@/components/admin/GalleryTab';
import ResultsManagementTab from '@/components/admin/ResultsManagementTab';
import PartnersManagementTab from '@/components/admin/PartnersManagementTab';

type TabType = 'applications' | 'contests' | 'concerts' | 'jury' | 'jury-accounts' | 'scoring' | 'gallery' | 'results' | 'partners';

interface AdminTabContentProps {
  activeTab: TabType;
  loading: boolean;

  applications: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  contestFilter: string;
  setContestFilter: (filter: string) => void;
  contests: any[];
  handleUpdateStatus: (id: number, status: string) => Promise<void>;
  handleDeleteApplication: (id: number) => Promise<void>;

  handleCreateClick: () => void;
  openEditModal: (contest: any) => void;
  handleDeleteContest: (id: number) => Promise<void>;

  managedConcerts: any[];
  handleCreateConcertClick: () => void;
  openEditConcertModal: (concert: any) => void;
  handleDeleteConcert: (id: number) => Promise<void>;

  juryMembers: any[];
  handleCreateJuryClick: () => void;
  openEditJuryModal: (member: any) => void;
  handleDeleteJuryMember: (id: number) => Promise<void>;
  handleSetJuryCredentials: (juryId: number, username: string, password: string) => Promise<void>;

  participants: any[];
  scoringSelectedContest: string;
  handleContestChange: (contestId: string) => void;
  exportProtocol: () => void;
  handleDeleteParticipant: (participantId: number) => Promise<void>;

  galleryItems: any[];
  setShowUploadModal: (show: boolean) => void;
  deleteItem: (id: number) => Promise<void>;

  results: any[];
  handleCreateResultClick: () => void;
  openEditResultModal: (result: any) => void;
  handleDeleteResult: (id: number) => Promise<void>;

  partners: any[];
  handleCreatePartnerClick: () => void;
  openEditPartnerModal: (partner: any) => void;
  handleDeletePartner: (id: number) => Promise<void>;
}

const AdminTabContent = ({
  activeTab,
  loading,
  applications,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  contestFilter,
  setContestFilter,
  contests,
  handleUpdateStatus,
  handleDeleteApplication,
  handleCreateClick,
  openEditModal,
  handleDeleteContest,
  managedConcerts,
  handleCreateConcertClick,
  openEditConcertModal,
  handleDeleteConcert,
  juryMembers,
  handleCreateJuryClick,
  openEditJuryModal,
  handleDeleteJuryMember,
  handleSetJuryCredentials,
  participants,
  scoringSelectedContest,
  handleContestChange,
  exportProtocol,
  handleDeleteParticipant,
  galleryItems,
  setShowUploadModal,
  deleteItem,
  results,
  handleCreateResultClick,
  openEditResultModal,
  handleDeleteResult,
  partners,
  handleCreatePartnerClick,
  openEditPartnerModal,
  handleDeletePartner,
}: AdminTabContentProps) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  switch (activeTab) {
    case 'applications':
      return (
        <ApplicationsTab
          applications={applications}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          contestFilter={contestFilter}
          setContestFilter={setContestFilter}
          contests={contests}
          onUpdateStatus={handleUpdateStatus}
          onDeleteApplication={handleDeleteApplication}
        />
      );

    case 'contests':
      return (
        <ContestsTab
          contests={contests}
          onCreateClick={handleCreateClick}
          onEditClick={openEditModal}
          onDeleteClick={handleDeleteContest}
        />
      );

    case 'concerts':
      return (
        <ConcertsManagementTab
          concerts={managedConcerts}
          onCreateClick={handleCreateConcertClick}
          onEditClick={openEditConcertModal}
          onDeleteClick={handleDeleteConcert}
        />
      );

    case 'jury':
      return (
        <JuryTab
          juryMembers={juryMembers}
          onCreateClick={handleCreateJuryClick}
          onEditClick={openEditJuryModal}
          onDeleteClick={handleDeleteJuryMember}
        />
      );

    case 'jury-accounts':
      return (
        <JuryAccountsTab
          juryMembers={juryMembers}
          onSetCredentials={handleSetJuryCredentials}
        />
      );

    case 'scoring':
      return (
        <ScoringTab
          participants={participants}
          contests={contests}
          selectedContest={scoringSelectedContest}
          onContestChange={handleContestChange}
          onExportProtocol={exportProtocol}
          onDeleteParticipant={handleDeleteParticipant}
        />
      );

    case 'gallery':
      return (
        <GalleryTab
          items={galleryItems}
          onUploadClick={() => setShowUploadModal(true)}
          onDeleteClick={deleteItem}
        />
      );

    case 'results':
      return (
        <ResultsManagementTab
          results={results}
          onCreateClick={handleCreateResultClick}
          onEditClick={openEditResultModal}
          onDeleteClick={handleDeleteResult}
        />
      );

    case 'partners':
      return (
        <PartnersManagementTab
          partners={partners}
          onCreateClick={handleCreatePartnerClick}
          onEditClick={openEditPartnerModal}
          onDeleteClick={handleDeletePartner}
        />
      );

    default:
      return null;
  }
};

export default AdminTabContent;