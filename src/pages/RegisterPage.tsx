import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import RegisterStepPersonal from '@/components/register/RegisterStepPersonal';
import RegisterStepContest from '@/components/register/RegisterStepContest';
import RegisterStepFiles from '@/components/register/RegisterStepFiles';
import RegisterStepFinish from '@/components/register/RegisterStepFinish';

type FormData = {
  // Шаг 1: Личные данные
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  city: string;
  password: string;
  
  // Шаг 2: Конкурс
  contestId: string;
  category: string;
  performanceTitle: string;
  participationFormat: string;
  nomination: string;
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
    password: '',
    contestId: '',
    category: '',
    performanceTitle: '',
    participationFormat: '',
    nomination: '',
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
        const activeContests = (data.contests || []).filter(
          (contest: { status: string }) => contest.status === 'active'
        );
        setContests(activeContests);
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
          password: formData.password,
          contestId: formData.contestId,
          category: formData.category,
          performanceTitle: formData.performanceTitle,
          participationFormat: formData.participationFormat,
          nomination: formData.nomination,
          experience: formData.experience,
          achievements: formData.achievements,
          additionalInfo: formData.additionalInfo,
          filesCount: formData.files.length,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Upload files if any
        if (formData.files.length > 0) {
          const filePromises = formData.files.map(file => 
            new Promise<{fileName: string, fileType: string, fileSize: number, fileData: string}>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve({
                  fileName: file.name,
                  fileType: file.type,
                  fileSize: file.size,
                  fileData: base64
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
          );

          const filesData = await Promise.all(filePromises);

          await fetch('https://functions.poehali.dev/cfc99bc2-daff-4110-b9e4-c9699841a7d3', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              applicationId: result.applicationId,
              files: filesData
            }),
          });
        }

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
    'Загрузка файлов',
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
              <RegisterStepPersonal 
                formData={formData}
                setFormData={setFormData}
              />
            )}

            {/* Step 2: Выбор конкурса */}
            {step === 2 && (
              <RegisterStepContest
                formData={formData}
                setFormData={setFormData}
                contests={contests}
                loadingContests={loadingContests}
              />
            )}

            {/* Step 3: Загрузка файлов */}
            {step === 3 && (
              <RegisterStepFiles
                formData={formData}
                handleFilesChange={handleFilesChange}
              />
            )}

            {/* Step 4: Дополнительная информация */}
            {step === 4 && (
              <RegisterStepFinish
                formData={formData}
                setFormData={setFormData}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  className="flex-1"
                >
                  <Icon name="ChevronLeft" size={20} className="mr-2" />
                  Назад
                </Button>
              )}
              
              {step < totalSteps ? (
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Далее
                  <Icon name="ChevronRight" size={20} className="ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-secondary hover:bg-secondary/90"
                >
                  Отправить заявку
                  <Icon name="Send" size={20} className="ml-2" />
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