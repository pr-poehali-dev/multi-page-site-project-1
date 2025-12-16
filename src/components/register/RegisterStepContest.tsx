import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface RegisterStepContestProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  contests: Array<{ id: number; title: string }>;
  loadingContests: boolean;
}

const RegisterStepContest = ({ formData, setFormData, contests, loadingContests }: RegisterStepContestProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-heading font-bold mb-6">Выбор конкурса</h2>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Конкурс <span className="text-destructive">*</span>
        </label>
        <Select
          value={formData.contestId}
          onValueChange={(value) => setFormData({ ...formData, contestId: value })}
          disabled={loadingContests}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingContests ? "Загрузка..." : "Выберите конкурс"} />
          </SelectTrigger>
          <SelectContent>
            {contests.map((contest) => (
              <SelectItem key={contest.id} value={contest.id.toString()}>
                {contest.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Категория <span className="text-destructive">*</span>
        </label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите категорию" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="junior">Юниоры (до 14 лет)</SelectItem>
            <SelectItem value="youth">Молодёжь (15-18 лет)</SelectItem>
            <SelectItem value="adult">Взрослые (19-25 лет)</SelectItem>
            <SelectItem value="professional">Профессионалы (25+ лет)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Название номера <span className="text-destructive">*</span>
        </label>
        <Input
          placeholder="Например: 'Танец с огнём', 'Соло на скрипке'"
          value={formData.performanceTitle}
          onChange={(e) => setFormData({ ...formData, performanceTitle: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Формат участия <span className="text-destructive">*</span>
          </label>
          <Select
            value={formData.participationFormat}
            onValueChange={(value) => setFormData({ ...formData, participationFormat: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите формат" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="offline">Очное</SelectItem>
              <SelectItem value="online">Заочное</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Номинация <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="Например: 'Вокал', 'Хореография'"
            value={formData.nomination}
            onChange={(e) => setFormData({ ...formData, nomination: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Опыт выступлений
        </label>
        <Select
          value={formData.experience}
          onValueChange={(value) => setFormData({ ...formData, experience: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите уровень опыта" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Начинающий (менее 1 года)</SelectItem>
            <SelectItem value="intermediate">Средний (1-3 года)</SelectItem>
            <SelectItem value="advanced">Продвинутый (3-5 лет)</SelectItem>
            <SelectItem value="expert">Эксперт (более 5 лет)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default RegisterStepContest;
