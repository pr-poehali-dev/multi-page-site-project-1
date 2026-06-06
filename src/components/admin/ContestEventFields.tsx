import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { ContestFormData } from './ContestModalTypes';

interface ContestEventFieldsProps {
  formData: ContestFormData;
  setFormData: (data: ContestFormData) => void;
}

const ContestEventFields = ({ formData, setFormData }: ContestEventFieldsProps) => {
  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Icon name="CalendarDays" size={18} />
        Информация о концерте/мероприятии (опционально)
      </h4>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Дата и время мероприятия</label>
          <Input
            type="text"
            value={formData.event_date || ''}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            placeholder="Например: 15 марта 2025, 18:00"
          />
        </div>


      </div>
    </div>
  );
};

export default ContestEventFields;