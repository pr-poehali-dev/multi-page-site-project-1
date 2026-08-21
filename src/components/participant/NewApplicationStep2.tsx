import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

export interface CustomField {
  id: number;
  field_name: string;
  field_label: string;
  field_type: string;
  options: string;
  is_required: boolean;
  system_key?: string | null;
}

export interface NominationOption {
  id: number;
  name: string;
}

const CUSTOM_FILE_MAX_SIZE = 15 * 1024 * 1024;
const CUSTOM_AUDIO_MAX_SIZE = 50 * 1024 * 1024;

interface NewApplicationStep2Props {
  loadingCustomFields: boolean;
  customFields: CustomField[];
  customValues: Record<string, string>;
  customFileValues: Record<string, File>;
  customAudioFileValues: Record<string, File>;
  noAudioValues: Record<string, boolean>;
  nominationOptions: NominationOption[];
  nominationId: number | null;
  step2Attempted: boolean;
  onCustomValuesChange: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onCustomFileValuesChange: React.Dispatch<React.SetStateAction<Record<string, File>>>;
  onCustomAudioFileValuesChange: React.Dispatch<React.SetStateAction<Record<string, File>>>;
  onNoAudioValuesChange: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onNominationIdChange: (id: number | null) => void;
}

const NewApplicationStep2 = ({
  loadingCustomFields,
  customFields,
  customValues,
  customFileValues,
  customAudioFileValues,
  noAudioValues,
  nominationOptions,
  nominationId,
  step2Attempted,
  onCustomValuesChange,
  onCustomFileValuesChange,
  onCustomAudioFileValuesChange,
  onNoAudioValuesChange,
  onNominationIdChange,
}: NewApplicationStep2Props) => {
  const { toast } = useToast();

  return (
    <div className="space-y-4 animate-fade-in">
      {loadingCustomFields && (
        <div className="text-center py-4">
          <Icon name="Loader2" size={20} className="mx-auto animate-spin text-muted-foreground" />
        </div>
      )}

      {!loadingCustomFields && customFields.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Icon name="CheckCircle2" size={32} className="mx-auto mb-2 opacity-40" />
          <p>Для этого конкурса нет дополнительных вопросов</p>
        </div>
      )}

      {customFields.length > 0 && (
        <div className="space-y-4">
          {customFields.map(f => {
            const skipRequired = f.field_type === 'audio' && noAudioValues[f.field_name];
            const isEmpty = f.is_required && !skipRequired && !customValues[f.field_name]?.trim();
            const showError = step2Attempted && isEmpty;
            return (
            <div key={f.id}>
              <label className="block text-sm font-medium mb-2">
                {f.field_label} {f.is_required && <span className="text-destructive">*</span>}
              </label>
              {f.system_key === 'nomination' ? (
                nominationOptions.length > 0 ? (
                  <Select
                    value={nominationId ? String(nominationId) : ''}
                    onValueChange={val => {
                      const opt = nominationOptions.find(o => String(o.id) === val);
                      onNominationIdChange(opt?.id ?? null);
                      onCustomValuesChange(v => ({ ...v, [f.field_name]: opt?.name ?? '' }));
                    }}
                  >
                    <SelectTrigger className={showError ? 'border-destructive ring-1 ring-destructive' : ''}><SelectValue placeholder="Выберите номинацию" /></SelectTrigger>
                    <SelectContent>
                      {nominationOptions.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground py-2">Организатор ещё не добавил номинации для этого конкурса</p>
                )
              ) : f.field_type === 'textarea' ? (
                <Textarea
                  value={customValues[f.field_name] || ''}
                  onChange={e => onCustomValuesChange(v => ({ ...v, [f.field_name]: e.target.value }))}
                  className={showError ? 'border-destructive ring-1 ring-destructive' : ''}
                />
              ) : f.field_type === 'select' ? (
                <Select
                  value={customValues[f.field_name] || ''}
                  onValueChange={val => onCustomValuesChange(v => ({ ...v, [f.field_name]: val }))}
                >
                  <SelectTrigger className={showError ? 'border-destructive ring-1 ring-destructive' : ''}><SelectValue placeholder="Выберите" /></SelectTrigger>
                  <SelectContent>
                    {f.options.split(',').map(o => o.trim()).filter(Boolean).map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.field_type === 'checkbox' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={customValues[f.field_name] === 'true'}
                    onChange={e => onCustomValuesChange(v => ({ ...v, [f.field_name]: e.target.checked ? 'true' : 'false' }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-muted-foreground">Да</span>
                </div>
              ) : f.field_type === 'file' ? (
                <div>
                  <input
                    type="file"
                    id={`custom-file-${f.id}`}
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > CUSTOM_FILE_MAX_SIZE) {
                        toast({ title: 'Файл слишком большой', description: `${file.name} превышает 15 МБ`, variant: 'destructive' });
                        e.target.value = '';
                        return;
                      }
                      onCustomFileValuesChange(v => ({ ...v, [f.field_name]: file }));
                      onCustomValuesChange(v => ({ ...v, [f.field_name]: file.name }));
                    }}
                  />
                  <label htmlFor={`custom-file-${f.id}`}>
                    <Button type="button" variant="outline" className={`w-full cursor-pointer ${showError ? 'border-destructive ring-1 ring-destructive' : ''}`} asChild>
                      <span>
                        <Icon name="Upload" size={16} className="mr-2" />
                        {customFileValues[f.field_name] ? customFileValues[f.field_name].name : 'Выбрать файл'}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">Максимум 15 МБ</p>
                </div>
              ) : f.field_type === 'audio' ? (
                <div>
                  <input
                    type="file"
                    accept="audio/*"
                    id={`custom-audio-${f.id}`}
                    className="hidden"
                    disabled={noAudioValues[f.field_name]}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > CUSTOM_AUDIO_MAX_SIZE) {
                        toast({ title: 'Файл слишком большой', description: `${file.name} превышает 50 МБ`, variant: 'destructive' });
                        e.target.value = '';
                        return;
                      }
                      onCustomAudioFileValuesChange(v => ({ ...v, [f.field_name]: file }));
                      onCustomValuesChange(v => ({ ...v, [f.field_name]: file.name }));
                    }}
                  />
                  <label htmlFor={`custom-audio-${f.id}`}>
                    <Button type="button" variant="outline" disabled={noAudioValues[f.field_name]} className={`w-full cursor-pointer ${showError ? 'border-destructive ring-1 ring-destructive' : ''}`} asChild>
                      <span>
                        <Icon name="Music" size={16} className="mr-2" />
                        {customAudioFileValues[f.field_name] ? customAudioFileValues[f.field_name].name : 'Выбрать фонограмму'}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">Загрузится на Яндекс.Диск, максимум 50 МБ</p>
                  {f.is_required && (
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!noAudioValues[f.field_name]}
                        onChange={e => {
                          const checked = e.target.checked;
                          onNoAudioValuesChange(v => ({ ...v, [f.field_name]: checked }));
                          if (checked) {
                            onCustomAudioFileValuesChange(v => {
                              const next = { ...v };
                              delete next[f.field_name];
                              return next;
                            });
                            onCustomValuesChange(v => ({ ...v, [f.field_name]: '' }));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-muted-foreground">Без фонограммы</span>
                    </label>
                  )}
                </div>
              ) : (
                <Input
                  type={f.field_type}
                  value={customValues[f.field_name] || ''}
                  onChange={e => onCustomValuesChange(v => ({ ...v, [f.field_name]: e.target.value }))}
                  className={showError ? 'border-destructive ring-1 ring-destructive' : ''}
                />
              )}
              {showError && (
                <p className="text-xs text-destructive mt-1">Это поле обязательно для заполнения</p>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NewApplicationStep2;
