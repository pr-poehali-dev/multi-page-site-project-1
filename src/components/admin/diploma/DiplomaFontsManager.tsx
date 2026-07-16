import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { DiplomaFont } from '@/types/diploma';

interface DiplomaFontsManagerProps {
  fonts: DiplomaFont[];
  onUpload: (name: string, file: File) => Promise<DiplomaFont | null>;
  onDelete: (id: number) => void;
  onClose: () => void;
}

const DiplomaFontsManager = ({ fonts, onUpload, onDelete, onClose }: DiplomaFontsManagerProps) => {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!name.trim() || !file) return;
    setUploading(true);
    const result = await onUpload(name.trim(), file);
    if (result) { setName(''); setFile(null); }
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Шрифты для дипломов</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><Icon name="X" size={16} /></Button>
        </div>

        <div className="space-y-2 mb-4 max-h-56 overflow-y-auto">
          {fonts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Пока нет загруженных шрифтов</p>
          )}
          {fonts.map(f => (
            <div key={f.id} className="flex items-center justify-between border rounded-lg p-2">
              <span className="text-sm" style={{ fontFamily: f.name }}>{f.name}</span>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(f.id)}>
                <Icon name="Trash2" size={14} />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t pt-4">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Название шрифта" />
          <label>
            <Button variant="outline" asChild className="w-full">
              <span className="cursor-pointer">
                <Icon name="Upload" size={14} className="mr-2" />
                {file ? file.name : 'Выбрать файл .ttf / .otf'}
              </span>
            </Button>
            <input type="file" accept=".ttf,.otf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
          <Button className="w-full" onClick={handleUpload} disabled={!name.trim() || !file || uploading}>
            {uploading ? <Icon name="Loader" size={14} className="mr-2 animate-spin" /> : <Icon name="Plus" size={14} className="mr-2" />}
            Загрузить шрифт
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DiplomaFontsManager;
