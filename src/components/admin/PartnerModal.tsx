import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PartnerModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  formData: {
    name: string;
    logo_url: string;
    website_url: string;
    display_order: number;
    is_active: boolean;
  };
  setFormData: (data: any) => void;
  onClose: () => void;
  onSubmit: () => void;
  partnerId?: number;
}

const PartnerModal = ({
  isOpen,
  mode,
  formData,
  setFormData,
  onClose,
  onSubmit,
}: PartnerModalProps) => {
  const { toast } = useToast();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ошибка',
        description: 'Можно загружать только изображения',
        variant: 'destructive'
      });
      return;
    }

    setUploadingLogo(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64String = (event.target?.result as string).split(',')[1];

          const response = await fetch('https://functions.poehali.dev/cfc99bc2-daff-4110-b9e4-c9699841a7d3', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              applicationId: 0,
              files: [{
                fileName: `partner_logo_${file.name}`,
                fileType: file.type,
                fileSize: file.size,
                fileData: base64String
              }]
            })
          });

          const data = await response.json();

          if (data.files && data.files.length > 0) {
            setFormData({ ...formData, logo_url: data.files[0].fileUrl });
            toast({
              title: 'Успешно',
              description: 'Логотип загружен'
            });
          } else {
            toast({
              title: 'Ошибка',
              description: 'Не удалось получить URL файла',
              variant: 'destructive'
            });
          }
        } catch (error) {
          console.error('Upload error:', error);
          toast({
            title: 'Ошибка',
            description: 'Не удалось загрузить логотип',
            variant: 'destructive'
          });
        } finally {
          setUploadingLogo(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('FileReader error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось прочитать файл',
        variant: 'destructive'
      });
      setUploadingLogo(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-heading font-bold">
            {mode === 'create' ? 'Добавить партнёра' : 'Редактировать партнёра'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Название *</label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Например: Министерство культуры"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Icon name="Image" size={16} />
              Логотип *
            </label>
            <div className="flex gap-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="flex-1"
              >
                <Icon name="Upload" size={16} className="mr-2" />
                {uploadingLogo ? 'Загрузка...' : formData.logo_url ? 'Заменить логотип' : 'Загрузить логотип'}
              </Button>
              {formData.logo_url && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open(formData.logo_url, '_blank')}
                >
                  <Icon name="ExternalLink" size={16} />
                </Button>
              )}
            </div>
            {formData.logo_url && (
              <div className="mt-3 flex justify-center">
                <img 
                  src={formData.logo_url} 
                  alt="Логотип партнёра" 
                  className="max-h-32 object-contain border rounded p-2"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Сайт партнёра</label>
            <Input
              value={formData.website_url}
              onChange={(e) =>
                setFormData({ ...formData, website_url: e.target.value })
              }
              placeholder="https://example.com"
              type="url"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Порядок отображения</label>
            <Input
              type="number"
              value={formData.display_order}
              onChange={(e) =>
                setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
              }
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Чем меньше число, тем выше партнёр в списке
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
            <Label htmlFor="is_active">Отображать на сайте</Label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            className="flex-1 bg-secondary hover:bg-secondary/90"
            onClick={onSubmit}
          >
            {mode === 'create' ? 'Добавить' : 'Сохранить'}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PartnerModal;