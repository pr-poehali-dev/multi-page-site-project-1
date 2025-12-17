import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface JuryFormData {
  name: string;
  role: string;
  specialty: string;
  bio: string;
  image_url: string;
  sort_order: number;
}

interface JuryModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  formData: JuryFormData;
  setFormData: (data: JuryFormData) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const JuryModal = ({ isOpen, mode, formData, setFormData, onClose, onSubmit }: JuryModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card">
          <h2 className="text-2xl font-heading font-bold">
            {mode === 'create' ? 'Добавить члена жюри' : 'Редактировать члена жюри'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">ФИО</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Анна Петрова"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Должность</label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Заслуженная артистка России"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Специализация</label>
            <input
              type="text"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Вокал"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Биография</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
              placeholder="Краткая биография и достижения..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">URL фотографии</label>
            <input
              type="text"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="https://example.com/photo.jpg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Оставьте пустым, если фото нет
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Порядок сортировки</label>
            <input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="0"
            />
          </div>
        </div>

        <div className="p-6 border-t border-border flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={onSubmit} className="bg-secondary hover:bg-secondary/90">
            {mode === 'create' ? 'Создать' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JuryModal;