import { Input } from '@/components/ui/input';

type FormData = {
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  city: string;
  password: string;
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

interface RegisterStepPersonalProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
}

const RegisterStepPersonal = ({ formData, setFormData }: RegisterStepPersonalProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-heading font-bold mb-6">Личные данные</h2>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          ФИО <span className="text-destructive">*</span>
        </label>
        <Input
          placeholder="Иванов Иван Иванович"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Email <span className="text-destructive">*</span>
          </label>
          <Input
            type="email"
            placeholder="example@mail.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Телефон <span className="text-destructive">*</span>
          </label>
          <Input
            type="tel"
            placeholder="+7 (999) 999-99-99"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Дата рождения <span className="text-destructive">*</span>
          </label>
          <Input
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Город <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="Москва"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Пароль для личного кабинета <span className="text-destructive">*</span>
        </label>
        <Input
          type="password"
          placeholder="Минимум 6 символов"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          minLength={6}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Используйте этот пароль для входа в личный кабинет
        </p>
      </div>
    </div>
  );
};

export default RegisterStepPersonal;