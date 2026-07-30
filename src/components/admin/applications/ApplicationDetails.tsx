import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Application, CustomFieldDef } from './applicationTypes';

interface ApplicationDetailsProps {
  app: Application;
  fieldDefsByContest: Record<number, CustomFieldDef[]>;
}

const ApplicationDetails = ({ app, fieldDefsByContest }: ApplicationDetailsProps) => {
  return (
    <div className="mt-4 pt-4 border-t border-border space-y-3 animate-fade-in">
      {app.admin_comment && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm font-medium text-amber-800 mb-1 flex items-center gap-1.5">
            <Icon name="MessageSquare" size={14} /> Комментарий организатора
          </p>
          <p className="text-sm text-amber-900 whitespace-pre-wrap">{app.admin_comment}</p>
        </div>
      )}
      {app.achievements && (
        <div>
          <p className="text-sm font-medium mb-1">Достижения:</p>
          <p className="text-sm text-muted-foreground">{app.achievements}</p>
        </div>
      )}
      {app.additional_info && (
        <div>
          <p className="text-sm font-medium mb-1">Дополнительная информация:</p>
          <p className="text-sm text-muted-foreground">{app.additional_info}</p>
        </div>
      )}
      {app.custom_fields && Object.keys(app.custom_fields).length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Ответы на дополнительные вопросы:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/30 rounded-lg p-3">
            {Object.entries(app.custom_fields).map(([key, value]) => {
              const defs = fieldDefsByContest[app.contest_id] || [];
              const def = defs.find(d => d.field_name === key);
              const label = def?.field_label || key;
              const isAudio = def?.field_type === 'audio';
              const displayValue = def?.field_type === 'checkbox'
                ? (value === 'true' ? 'Да' : 'Нет')
                : (value || '—');
              return (
                <div key={key}>
                  <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                  {isAudio && value ? (
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-secondary hover:underline flex items-center gap-1"
                    >
                      <Icon name="Music" size={14} /> Открыть фонограмму на Яндекс.Диске
                    </a>
                  ) : (
                    <p className="text-sm font-medium">{displayValue}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {app.files && app.files.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Прикреплённые файлы ({app.files.length}):</p>
          <div className="space-y-2">
            {app.files.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                <Icon name="File" size={16} className="text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{file.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.file_type} • {(file.file_size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button size="sm" variant="ghost" asChild>
                  <a href={file.file_url} target="_blank" rel="noopener noreferrer" download>
                    <Icon name="Download" size={14} />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon name="Hash" size={14} />
        <span>ID заявки: {app.id}</span>
      </div>
    </div>
  );
};

export default ApplicationDetails;
