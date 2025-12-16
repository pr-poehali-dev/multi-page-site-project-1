import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ContestModalProps {
  show: boolean;
  mode: 'create' | 'edit';
  formData: {
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  setFormData: (data: any) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const ContestModal = ({
  show,
  mode,
  formData,
  setFormData,
  onClose,
  onSubmit,
}: ContestModalProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-heading font-bold">
            {mode === 'create' ? 'Создать конкурс' : 'Редактировать конкурс'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Название</label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Введите название конкурса"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Описание</label>
            <textarea
              className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Введите описание конкурса"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Дата начала
              </label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Дата окончания
              </label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Статус</label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Предстоящий</SelectItem>
                <SelectItem value="active">Активный</SelectItem>
                <SelectItem value="completed">Завершён</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            className="flex-1 bg-secondary hover:bg-secondary/90"
            onClick={onSubmit}
          >
            {mode === 'create' ? 'Создать' : 'Сохранить'}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ContestModal;
