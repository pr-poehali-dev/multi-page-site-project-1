import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ContestFormData } from './ContestModalTypes';

interface ContestBasicFieldsProps {
  formData: ContestFormData;
  setFormData: (data: ContestFormData) => void;
}

const ContestBasicFields = ({ formData, setFormData }: ContestBasicFieldsProps) => {
  return (
    <>
      <div>
        <label className="text-sm font-medium mb-2 block">Название</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Введите название конкурса"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Описание</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Введите описание конкурса"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Дата начала</label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Дата окончания</label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Статус</label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value })}
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

      <div>
        <label className="text-sm font-medium mb-2 block">Правила (опционально)</label>
        <Textarea
          value={formData.rules || ''}
          onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
          placeholder="Правила участия в конкурсе"
          rows={3}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Категории (опционально)</label>
        <Textarea
          value={formData.categories || ''}
          onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
          placeholder="Категории участия"
          rows={3}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Призы (опционально)</label>
        <Textarea
          value={formData.prizes || ''}
          onChange={(e) => setFormData({ ...formData, prizes: e.target.value })}
          placeholder="Призовой фонд"
          rows={3}
        />
      </div>
    </>
  );
};

export default ContestBasicFields;
