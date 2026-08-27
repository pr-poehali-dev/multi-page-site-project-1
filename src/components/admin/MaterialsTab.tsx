import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { adminHeaders } from '@/config/adminApi';

const API = 'https://functions.poehali.dev/PLACEHOLDER_MATERIALS_URL';

interface ApplicationOption {
  id: number;
  full_name: string;
  performance_title: string | null;
  status: string;
  contest_id: number;
  contest_title: string;
  materials_count: number;
}

interface Material {
  id: number;
  application_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_at: string;
}

interface Contest {
  id: number;
  title: string;
}

interface MaterialsTabProps {
  contests: Contest[];
}

const MAX_FILE_SIZE_MB = 200;

const formatSize = (bytes: number) => {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} МБ` : `${(bytes / 1024).toFixed(0)} КБ`;
};

const MaterialsTab = ({ contests }: MaterialsTabProps) => {
  const { toast } = useToast();
  const [contestFilter, setContestFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ApplicationOption | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadApplications = async () => {
    setLoadingApps(true);
    try {
      const params = new URLSearchParams({ action: 'applications' });
      if (contestFilter !== 'all') params.append('contest_id', contestFilter);
      if (search.trim()) params.append('search', search.trim());
      const res = await fetch(`${API}?${params}`, { headers: adminHeaders() });
      const data = await res.json();
      setApplications(data.applications || []);
    } catch {
      setApplications([]);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(loadApplications, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contestFilter, search]);

  const loadMaterials = async (appId: number) => {
    setLoadingMaterials(true);
    try {
      const res = await fetch(`${API}?action=materials&application_id=${appId}`, { headers: adminHeaders() });
      const data = await res.json();
      setMaterials(data.materials || []);
    } catch {
      setMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const openApplication = (app: ApplicationOption) => {
    setSelectedApp(app);
    loadMaterials(app.id);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || !selectedApp) return;
    const files = Array.from(fileList);
    const oversized = files.find((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (oversized) {
      toast({ title: 'Файл слишком большой', description: `Максимум ${MAX_FILE_SIZE_MB} МБ на файл`, variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const payload = await Promise.all(
        files.map(async (file) => ({
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
          fileData: await fileToBase64(file),
        }))
      );
      const res = await fetch(`${API}?action=upload`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ applicationId: selectedApp.id, files: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'Материалы загружены', description: `Файлов: ${data.materials?.length || 0}` });
      loadMaterials(selectedApp.id);
      loadApplications();
    } catch (e: unknown) {
      toast({ title: 'Ошибка загрузки', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: number) => {
    if (!confirm('Удалить этот файл? Действие необратимо.')) return;
    try {
      const res = await fetch(`${API}?id=${materialId}`, { method: 'DELETE', headers: adminHeaders() });
      if (!res.ok) throw new Error('Не удалось удалить файл');
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      if (selectedApp) loadApplications();
      toast({ title: 'Файл удалён' });
    } catch (e: unknown) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-heading font-bold mb-1">Материалы по проектам</h2>
        <p className="text-muted-foreground">Загрузите фото и видео с выступления участника — они появятся в его личном кабинете</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
        {/* Список заявок */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <Input
              placeholder="Поиск по имени участника..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <select
              className="border rounded-md px-3 py-2 text-sm bg-background"
              value={contestFilter}
              onChange={(e) => setContestFilter(e.target.value)}
            >
              <option value="all">Все конкурсы</option>
              {contests.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {loadingApps ? (
            <div className="py-10 text-center text-muted-foreground">
              <Icon name="Loader2" size={28} className="animate-spin mx-auto mb-2" />
              Загрузка...
            </div>
          ) : applications.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">Заявки не найдены</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {applications.map((app) => (
                <button
                  key={app.id}
                  onClick={() => openApplication(app)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedApp?.id === app.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{app.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {app.contest_title}{app.performance_title ? ` • ${app.performance_title}` : ''}
                      </p>
                    </div>
                    {app.materials_count > 0 && (
                      <span className="shrink-0 bg-secondary/15 text-secondary text-xs font-semibold rounded-full px-2 py-1">
                        {app.materials_count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Материалы выбранной заявки */}
        <Card className="p-4">
          {!selectedApp ? (
            <div className="py-16 text-center text-muted-foreground">
              <Icon name="FolderOpen" size={40} className="mx-auto mb-3 opacity-40" />
              Выберите заявку слева, чтобы загрузить или посмотреть материалы
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="font-semibold text-lg">{selectedApp.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedApp.contest_title}</p>
              </div>

              <label className="block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/40 transition-colors mb-4">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Icon name="Loader2" size={28} className="animate-spin" />
                    Загрузка...
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Icon name="UploadCloud" size={28} />
                    <span>Нажмите, чтобы выбрать фото или видео</span>
                    <span className="text-xs">До {MAX_FILE_SIZE_MB} МБ на файл</span>
                  </div>
                )}
              </label>

              {loadingMaterials ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Icon name="Loader2" size={24} className="animate-spin mx-auto" />
                </div>
              ) : materials.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">Материалов пока нет</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {materials.map((m) => {
                    const isVideo = m.file_type?.startsWith('video/');
                    return (
                      <div key={m.id} className="relative group rounded-lg overflow-hidden border bg-muted/30">
                        {isVideo ? (
                          <video src={m.file_url} className="w-full h-28 object-cover" />
                        ) : (
                          <img src={m.file_url} alt={m.file_name} className="w-full h-28 object-cover" />
                        )}
                        <div className="p-2">
                          <p className="text-xs truncate" title={m.file_name}>{m.file_name}</p>
                          <p className="text-[11px] text-muted-foreground">{formatSize(m.file_size)}</p>
                        </div>
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="secondary" className="h-7 w-7" asChild>
                            <a href={m.file_url} target="_blank" rel="noopener noreferrer" download>
                              <Icon name="Download" size={14} />
                            </a>
                          </Button>
                          <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => handleDelete(m.id)}>
                            <Icon name="Trash2" size={14} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MaterialsTab;
