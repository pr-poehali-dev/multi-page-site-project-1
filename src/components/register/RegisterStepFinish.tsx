import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

type FormData = {
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  city: string;
  contestId: string;
  category: string;
  performanceTitle: string;
  participationFormat: string;
  nomination: string;
  experience: string;
  files: File[];
  achievements: string;
  additionalInfo: string;
};

interface RegisterStepFinishProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
}

const RegisterStepFinish = ({ formData, setFormData }: RegisterStepFinishProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-heading font-bold mb-6">Завершение регистрации</h2>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Достижения и награды
        </label>
        <Textarea
          placeholder="Расскажите о своих достижениях, наградах, участии в других конкурсах..."
          rows={5}
          value={formData.achievements}
          onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Дополнительная информация
        </label>
        <Textarea
          placeholder="Любая другая информация, которую вы хотели бы сообщить..."
          rows={5}
          value={formData.additionalInfo}
          onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
        />
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="CheckCircle2" size={24} className="text-primary" />
            </div>
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg mb-2">Проверьте данные</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Убедитесь, что все данные введены корректно. После отправки заявки вы сможете
              отслеживать её статус в личном кабинете.
            </p>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <Icon name="Check" size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <span>Заявка будет рассмотрена в течение 3 рабочих дней</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <span>Мы свяжемся с вами по указанным контактам</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <span>Вы получите уведомление о статусе заявки</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterStepFinish;
