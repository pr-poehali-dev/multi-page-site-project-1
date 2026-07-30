import { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import RejectApplicationDialog from './RejectApplicationDialog';
import MaintenanceNoticeSettings from './MaintenanceNoticeSettings';
import { Application, CustomFieldDef } from './applications/applicationTypes';
import ApplicationsFilters from './applications/ApplicationsFilters';
import ApplicationCard from './applications/ApplicationCard';

const CONTESTS_API = 'https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3';

interface ApplicationsTabProps {
  applications: Application[];
  loading?: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  contestFilter: string;
  setContestFilter: (filter: string) => void;
  contests: any[];
  onUpdateStatus: (applicationId: number, newStatus: string, adminComment?: string) => void;
  onDeleteApplication: (applicationId: number) => void;
  onToggleEditingLock: (applicationId: number, locked: boolean) => void;
  onToggleContestLock: (contestId: number, locked: boolean) => void;
  onRefresh?: () => void;
}

const ApplicationsTab = ({
  applications,
  loading = false,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  contestFilter,
  setContestFilter,
  onUpdateStatus,
  onDeleteApplication,
  onToggleEditingLock,
  onToggleContestLock,
  onRefresh,
}: ApplicationsTabProps) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [fieldDefsByContest, setFieldDefsByContest] = useState<Record<number, CustomFieldDef[]>>({});
  const [rejectDialog, setRejectDialog] = useState<{ appId: number; status: 'rejected' | 'pending' } | null>(null);

  const loadFieldDefs = useCallback(async (contestId: number) => {
    if (fieldDefsByContest[contestId]) return;
    try {
      const res = await fetch(`${CONTESTS_API}?action=contest_form&contest_id=${contestId}`);
      const data = await res.json();
      setFieldDefsByContest(prev => ({ ...prev, [contestId]: data.fields || [] }));
    } catch {
      setFieldDefsByContest(prev => ({ ...prev, [contestId]: [] }));
    }
  }, [fieldDefsByContest]);

  const toggleExpand = (app: Application) => {
    const next = expandedId === app.id ? null : app.id;
    setExpandedId(next);
    if (next !== null && app.custom_fields && Object.keys(app.custom_fields).length > 0) {
      loadFieldDefs(app.contest_id);
    }
  };

  const filteredApplications = useMemo(() => {
    return applications.filter(
      (app) =>
        searchQuery === '' ||
        app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.id.toString().includes(searchQuery)
    );
  }, [applications, searchQuery]);

  return (
    <>
      <MaintenanceNoticeSettings />

      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          <Icon name="RefreshCw" size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>
      <ApplicationsFilters
        applications={applications}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        contestFilter={contestFilter}
        setContestFilter={setContestFilter}
        onToggleContestLock={onToggleContestLock}
      />

      {loading ? (
        <Card className="p-12 text-center">
          <Icon
            name="Loader"
            size={48}
            className="mx-auto mb-4 animate-spin text-primary"
          />
          <p className="text-muted-foreground">Загрузка заявок...</p>
        </Card>
      ) : filteredApplications.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon
            name="Inbox"
            size={48}
            className="mx-auto mb-4 text-muted-foreground"
          />
          <p className="text-muted-foreground">Заявок не найдено</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              expandedId={expandedId}
              fieldDefsByContest={fieldDefsByContest}
              onToggleExpand={toggleExpand}
              onUpdateStatus={onUpdateStatus}
              onDeleteApplication={onDeleteApplication}
              onToggleEditingLock={onToggleEditingLock}
              onToggleContestLock={onToggleContestLock}
              onOpenRejectDialog={(appId, status) => setRejectDialog({ appId, status })}
            />
          ))}
        </div>
      )}

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Показано заявок: {filteredApplications.length} из {applications.length}
      </div>

      <RejectApplicationDialog
        open={rejectDialog !== null}
        status={rejectDialog?.status ?? null}
        onClose={() => setRejectDialog(null)}
        onConfirm={(comment) => {
          if (rejectDialog) {
            onUpdateStatus(rejectDialog.appId, rejectDialog.status, comment);
          }
          setRejectDialog(null);
        }}
      />
    </>
  );
};

export default ApplicationsTab;
