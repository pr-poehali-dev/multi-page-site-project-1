import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Contest {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  pdf_url?: string;
  application_form_url?: string;
  event_date?: string;
}

interface ContestDetailHeroProps {
  contest: Contest;
  isPast: boolean;
  isActive: boolean;
  isFuture: boolean;
  daysUntilStart: number;
  daysUntilEnd: number;
}

const ContestDetailHero = ({ contest, isPast, isActive, isFuture, daysUntilStart, daysUntilEnd }: ContestDetailHeroProps) => {
  return (
    <div className="px-12 pt-8 pb-8 md:px-12 md:pt-12 md:pb-12">
      <div className="flex items-center gap-6 mb-6">
        <img
          src={contest.title.toLowerCase().includes('зимняя')
            ? 'https://cdn.poehali.dev/files/3D_логотип_фестиваля__Зимняя_мелодия__с_зимними_мо-no-bg-preview (carve.photos).png'
            : 'https://cdn.poehali.dev/files/лого таланты.png'
          }
          alt="Логотип"
          className="w-56 h-56 object-contain shrink-0"
        />
        <div className="flex items-start justify-between w-full">
          <h1 className="text-4xl md:text-5xl font-heading font-bold">
            {contest.title}
          </h1>
          <Badge
            className={`ml-4 shrink-0 ${
              isPast ? 'bg-gray-500' :
              isActive ? 'bg-green-500' :
              'bg-orange-500'
            }`}
          >
            {isPast ? 'Завершён' : isActive ? 'Активен' : 'Скоро'}
          </Badge>
        </div>
      </div>

      <p className="text-xl text-white/75 mb-6 whitespace-pre-wrap w-full">
        {contest.description}
      </p>

      {!isPast && (
        <div className="flex items-center gap-2 p-4 bg-secondary/20 rounded-lg mb-6 w-full">
          <Icon name="Clock" size={20} className="text-secondary" />
          <span className="font-medium">
            {isFuture ? (
              `Старт через ${daysUntilStart} ${daysUntilStart === 1 ? 'день' : daysUntilStart < 5 ? 'дня' : 'дней'}`
            ) : isActive ? (
              daysUntilEnd > 0
                ? `Осталось ${daysUntilEnd} ${daysUntilEnd === 1 ? 'день' : daysUntilEnd < 5 ? 'дня' : 'дней'} до окончания`
                : 'Последний день приёма заявок!'
            ) : ''}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-3 w-full">
        <Button
          size="lg"
          className="bg-secondary hover:bg-secondary/90"
          disabled={isPast || isFuture || !contest.application_form_url}
          onClick={() => contest.application_form_url && window.open(contest.application_form_url, '_blank')}
        >
          <Icon name="Send" size={20} className="mr-2" />
          {isPast ? 'Конкурс завершён' : isFuture ? 'Скоро откроется приём заявок' : 'Подать заявку'}
        </Button>
        {contest.pdf_url && (
          <Button
            size="lg"
            variant="outline"
            className="bg-secondary border-secondary text-white hover:bg-secondary/90"
            onClick={() => window.open(contest.pdf_url, '_blank')}
          >
            <Icon name="FileText" size={20} className="mr-2" />
            Скачать положение (PDF)
          </Button>
        )}
      </div>
    </div>
  );
};

export default ContestDetailHero;
