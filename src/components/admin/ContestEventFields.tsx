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
            type="datetime-local"
            value={formData.event_date || ''}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Место проведения</label>
          <Input
            value={formData.location || ''}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Например: ГДК, Воронеж"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <Icon name="Ticket" size={16} />
            Ссылка на покупку билетов
          </label>
          <Input
            value={formData.ticket_link || ''}
            onChange={(e) => setFormData({ ...formData, ticket_link: e.target.value })}
            placeholder="https://example.com/tickets"
            type="url"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <Icon name="Info" size={16} />
            Ссылка на подробности
          </label>
          <Input
            value={formData.details_link || ''}
            onChange={(e) => setFormData({ ...formData, details_link: e.target.value })}
            placeholder="https://example.com/details"
            type="url"
          />
        </div>
      </div>
    </div>
  );
};

export default ContestEventFields;
