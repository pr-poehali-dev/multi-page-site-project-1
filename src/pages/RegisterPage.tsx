import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '@/components/FileUpload';
import { useNavigate } from 'react-router-dom';

type FormData = {
  // Шаг 1: Личные данные
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  city: string;
  
  // Шаг 2: Конкурс
  contestId: string;
  category: string;
  experience: string;
  
  // Шаг 3: Файлы
  files: File[];
  
  // Шаг 4: Дополнительно
  achievements: string;
  additionalInfo: string;
};

const RegisterPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [contests, setContests] = useState<Array<{ id: number; title: string }>>([]);
  const [loadingContests, setLoadingContests] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    city: '',
    contestId: '',
    category: '',
    experience: '',
    files: [],
    achievements: '',
    additionalInfo: '',
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  useEffect(() => {
    const loadContests = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3');
        const data = await response.json();
        setContests(data.contests || []);
      } catch (error) {
        console.error('Ошибка загрузки конкурсов:', error);
      } finally {
        setLoadingContests(false);
      }
    };
    loadContests();
  }, []);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/065d2b6a-5112-4a26-a642-211398843a75', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          birthDate: formData.birthDate,
          city: formData.city,
          contestId: formData.contestId,
          category: formData.category,
          experience: formData.experience,
          achievements: formData.achievements,
          additionalInfo: formData.additionalInfo,
          filesCount: formData.files.length,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Заявка отправлена! 🎉',
          description: 'Мы проверим вашу заявку и свяжемся с вами в течение 3 дней.',
        });
        
        // Сохраняем email для получения данных профиля
        localStorage.setItem('userEmail', formData.email);
        
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось отправить заявку. Попробуйте снова.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Проблема с соединением. Проверьте интернет.',
        variant: 'destructive',
      });
    }
  };

  const handleFilesChange = (files: File[]) => {
    setFormData({ ...formData, files });
  };

  const stepTitles = [
    'Личные данные',
    'Выбор конкурса',
    'Загрузка работ',
    'Завершение',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Регистрация участника
            </h1>
            <p className="text-muted-foreground text-lg">
              Заполните все шаги для участия в конкурсе
            </p>
          </div>

          <Card className="p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between mb-4">
                {stepTitles.map((title, index) => (
                  <div
                    key={index}
                    className={`flex-1 text-center transition-all ${
                      index + 1 <= step ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 transition-all ${
                        index + 1 < step
                          ? 'bg-primary text-white'
                          : index + 1 === step
                          ? 'bg-primary text-white ring-4 ring-primary/20'
                          : 'bg-muted'
                      }`}
                    >
                      {index + 1 < step ? (
                        <Icon name="Check" size={20} />
                      ) : (
                        <span className="font-bold">{index + 1}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium hidden md:block">{title}</p>
                  </div>
                ))}
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step 1: Личные данные */}
            {step === 1 && (
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
              </div>
            )}

            {/* Step 2: Выбор конкурса */}
            {step === 2 && (
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
            )}

            {/* Step 3: Загрузка файлов */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-heading font-bold mb-6">Загрузка работ</h2>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Портфолио / Видео выступлений <span className="text-destructive">*</span>
                  </label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Загрузите фото, видео или документы (макс. 50 МБ каждый)
                  </p>
                  <FileUpload
                    files={formData.files}
                    onChange={handleFilesChange}
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    maxSize={50}
                  />
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Icon name="Info" size={20} className="text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold mb-1">Рекомендации по загрузке:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Видео: формат MP4, длительность до 10 минут</li>
                        <li>Фото: высокое разрешение, формат JPG или PNG</li>
                        <li>Документы: резюме, дипломы, сертификаты в PDF</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Дополнительная информация */}
            {step === 4 && (
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
                    placeholder="Любая дополнительная информация, которую вы хотите сообщить..."
                    rows={5}
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                  />
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
                  <h3 className="font-heading font-bold mb-2 flex items-center gap-2">
                    <Icon name="CheckCircle" size={20} className="text-primary" />
                    Проверьте ваши данные
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>ФИО:</strong> {formData.fullName}</p>
                    <p><strong>Email:</strong> {formData.email}</p>
                    <p><strong>Телефон:</strong> {formData.phone}</p>
                    <p><strong>Город:</strong> {formData.city}</p>
                    <p><strong>Файлов загружено:</strong> {formData.files.length}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={step === 1}
                className="gap-2"
              >
                <Icon name="ChevronLeft" size={20} />
                Назад
              </Button>

              {step < totalSteps ? (
                <Button
                  onClick={handleNext}
                  className="bg-secondary hover:bg-secondary/90 gap-2"
                  disabled={
                    (step === 1 && (!formData.fullName || !formData.email || !formData.phone)) ||
                    (step === 2 && (!formData.contestId || !formData.category)) ||
                    (step === 3 && formData.files.length === 0)
                  }
                >
                  Далее
                  <Icon name="ChevronRight" size={20} />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 gap-2"
                >
                  <Icon name="Send" size={20} />
                  Отправить заявку
                </Button>
              )}
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RegisterPage;