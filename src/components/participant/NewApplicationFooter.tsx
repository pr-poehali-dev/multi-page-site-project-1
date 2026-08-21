import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface NewApplicationFooterProps {
  step: number;
  totalSteps: number;
  submitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

const NewApplicationFooter = ({
  step,
  totalSteps,
  submitting,
  onBack,
  onNext,
  onSubmit,
}: NewApplicationFooterProps) => {
  return (
    <div className="flex gap-3 p-6 border-t shrink-0">
      {step > 1 && (
        <Button variant="outline" onClick={onBack} className="flex-1">
          <Icon name="ArrowLeft" size={16} className="mr-2" /> Назад
        </Button>
      )}
      {step < totalSteps ? (
        <Button
          className="flex-1 bg-secondary hover:bg-secondary/90"
          onClick={onNext}
        >
          Далее <Icon name="ArrowRight" size={16} className="ml-2" />
        </Button>
      ) : (
        <Button
          className="flex-1 bg-secondary hover:bg-secondary/90"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Отправка...</> : <><Icon name="Send" size={16} className="mr-2" />Отправить заявку</>}
        </Button>
      )}
    </div>
  );
};

export default NewApplicationFooter;
