import ContestModal from '@/components/admin/ContestModal';
import JuryModal from '@/components/admin/JuryModal';
import GalleryUploadModal from '@/components/admin/GalleryUploadModal';
import ConcertModal from '@/components/admin/ConcertModal';
import ResultModal from '@/components/admin/ResultModal';
import PartnerModal from '@/components/admin/PartnerModal';

interface AdminModalsContainerProps {
  showCreateModal: boolean;
  showEditModal: boolean;
  selectedContest: any;
  formData: any;
  setFormData: (data: any) => void;
  handleCreateContest: () => Promise<void>;
  handleEditContest: () => Promise<void>;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;

  showCreateJuryModal: boolean;
  showEditJuryModal: boolean;
  selectedJuryMember: any;
  juryFormData: any;
  setJuryFormData: (data: any) => void;
  handleCreateJuryMember: () => Promise<void>;
  handleEditJuryMember: () => Promise<void>;
  setShowCreateJuryModal: (show: boolean) => void;
  setShowEditJuryModal: (show: boolean) => void;

  showUploadModal: boolean;
  setShowUploadModal: (show: boolean) => void;
  uploadFile: (file: File, title: string, description: string) => Promise<void>;

  showCreateConcertModal: boolean;
  showEditConcertModal: boolean;
  selectedConcert: any;
  concertFormData: any;
  setConcertFormData: (data: any) => void;
  handleCreateConcert: () => Promise<void>;
  handleEditConcert: () => Promise<void>;
  setShowCreateConcertModal: (show: boolean) => void;
  setShowEditConcertModal: (show: boolean) => void;

  showCreateResultModal: boolean;
  showEditResultModal: boolean;
  selectedResult: any;
  resultFormData: any;
  setResultFormData: (data: any) => void;
  handleCreateResult: () => Promise<void>;
  handleEditResult: () => Promise<void>;
  setShowCreateResultModal: (show: boolean) => void;
  setShowEditResultModal: (show: boolean) => void;

  showCreatePartnerModal: boolean;
  showEditPartnerModal: boolean;
  selectedPartner: any;
  partnerFormData: any;
  setPartnerFormData: (data: any) => void;
  handleCreatePartner: () => Promise<void>;
  handleEditPartner: () => Promise<void>;
  setShowCreatePartnerModal: (show: boolean) => void;
  setShowEditPartnerModal: (show: boolean) => void;
}

const AdminModalsContainer = ({
  showCreateModal,
  showEditModal,
  selectedContest,
  formData,
  setFormData,
  handleCreateContest,
  handleEditContest,
  setShowCreateModal,
  setShowEditModal,

  showCreateJuryModal,
  showEditJuryModal,
  selectedJuryMember,
  juryFormData,
  setJuryFormData,
  handleCreateJuryMember,
  handleEditJuryMember,
  setShowCreateJuryModal,
  setShowEditJuryModal,

  showUploadModal,
  setShowUploadModal,
  uploadFile,

  showCreateConcertModal,
  showEditConcertModal,
  selectedConcert,
  concertFormData,
  setConcertFormData,
  handleCreateConcert,
  handleEditConcert,
  setShowCreateConcertModal,
  setShowEditConcertModal,

  showCreateResultModal,
  showEditResultModal,
  selectedResult,
  resultFormData,
  setResultFormData,
  handleCreateResult,
  handleEditResult,
  setShowCreateResultModal,
  setShowEditResultModal,

  showCreatePartnerModal,
  showEditPartnerModal,
  selectedPartner,
  partnerFormData,
  setPartnerFormData,
  handleCreatePartner,
  handleEditPartner,
  setShowCreatePartnerModal,
  setShowEditPartnerModal,
}: AdminModalsContainerProps) => {
  return (
    <>
      <ContestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateContest}
        formData={formData}
        setFormData={setFormData}
        mode="create"
      />

      <ContestModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditContest}
        formData={formData}
        setFormData={setFormData}
        mode="edit"
        contestId={selectedContest?.id}
      />

      <JuryModal
        isOpen={showCreateJuryModal}
        onClose={() => setShowCreateJuryModal(false)}
        onSubmit={handleCreateJuryMember}
        formData={juryFormData}
        setFormData={setJuryFormData}
        mode="create"
      />

      <JuryModal
        isOpen={showEditJuryModal}
        onClose={() => setShowEditJuryModal(false)}
        onSubmit={handleEditJuryMember}
        formData={juryFormData}
        setFormData={setJuryFormData}
        mode="edit"
        juryId={selectedJuryMember?.id}
      />

      <GalleryUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={uploadFile}
      />

      <ConcertModal
        isOpen={showCreateConcertModal}
        onClose={() => setShowCreateConcertModal(false)}
        onSubmit={handleCreateConcert}
        formData={concertFormData}
        setFormData={setConcertFormData}
        mode="create"
      />

      <ConcertModal
        isOpen={showEditConcertModal}
        onClose={() => setShowEditConcertModal(false)}
        onSubmit={handleEditConcert}
        formData={concertFormData}
        setFormData={setConcertFormData}
        mode="edit"
        concertId={selectedConcert?.id}
      />

      <ResultModal
        isOpen={showCreateResultModal}
        onClose={() => setShowCreateResultModal(false)}
        onSubmit={handleCreateResult}
        formData={resultFormData}
        setFormData={setResultFormData}
        mode="create"
      />

      <ResultModal
        isOpen={showEditResultModal}
        onClose={() => setShowEditResultModal(false)}
        onSubmit={handleEditResult}
        formData={resultFormData}
        setFormData={setResultFormData}
        mode="edit"
        resultId={selectedResult?.id}
      />

      <PartnerModal
        isOpen={showCreatePartnerModal}
        onClose={() => setShowCreatePartnerModal(false)}
        onSubmit={handleCreatePartner}
        formData={partnerFormData}
        setFormData={setPartnerFormData}
        mode="create"
      />

      <PartnerModal
        isOpen={showEditPartnerModal}
        onClose={() => setShowEditPartnerModal(false)}
        onSubmit={handleEditPartner}
        formData={partnerFormData}
        setFormData={setPartnerFormData}
        mode="edit"
        partnerId={selectedPartner?.id}
      />
    </>
  );
};

export default AdminModalsContainer;