import { useCallback, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type FileUploadProps = {
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  maxSize?: number; // MB
  maxFiles?: number;
};

const FileUpload = ({ files, onChange, accept = '*', maxSize = 50, maxFiles = 10 }: FileUploadProps) => {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;

    const fileArray = Array.from(newFiles);
    const validFiles: File[] = [];

    fileArray.forEach((file) => {
      // Проверка размера
      if (file.size > maxSize * 1024 * 1024) {
        toast({
          title: 'Файл слишком большой',
          description: `${file.name} превышает ${maxSize} МБ`,
          variant: 'destructive',
        });
        return;
      }

      // Проверка количества
      if (files.length + validFiles.length >= maxFiles) {
        toast({
          title: 'Слишком много файлов',
          description: `Максимум ${maxFiles} файлов`,
          variant: 'destructive',
        });
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      onChange([...files, ...validFiles]);
    }
  }, [files, onChange, maxSize, maxFiles, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return 'Image';
    if (type.startsWith('video/')) return 'Video';
    if (type.includes('pdf')) return 'FileText';
    return 'File';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragActive
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <Icon name="Upload" size={32} className="text-white" />
          </div>
          
          <div>
            <p className="text-lg font-semibold mb-1">
              Перетащите файлы сюда
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              или нажмите кнопку ниже для выбора
            </p>
          </div>

          <label htmlFor="file-upload">
            <Button type="button" variant="outline" className="cursor-pointer" asChild>
              <span>
                <Icon name="FolderOpen" size={18} className="mr-2" />
                Выбрать файлы
              </span>
            </Button>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept={accept}
              multiple
              onChange={handleChange}
            />
          </label>

          <p className="text-xs text-muted-foreground">
            Максимум {maxSize} МБ на файл • До {maxFiles} файлов
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Загружено файлов: {files.length}
          </p>
          
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors animate-fade-in"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name={getFileIcon(file) as any} size={20} className="text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>

                {file.type.startsWith('image/') && (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Icon name="X" size={18} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
