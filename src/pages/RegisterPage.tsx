import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import RegisterStepPersonal from '@/components/register/RegisterStepPersonal';

const REGISTER_URL = 'https://functions.poehali.dev/52234468-777f-4edf-ba7a-985257092904';

type FormData = {
  fullName: string;
  contactPosition: string;
  email: string;
  phone: string;
  vkLink: string;
  city: string;
  password: string;
};

const RegisterPage = () => {
  useSEO({
    title: 'Регистрация участника',
    description: 'Создайте аккаунт участника конкурсов ИНДИГО, чтобы подавать заявки на конкурсы прямо из личного кабинета.',
    keywords: 'регистрация участника, личный кабинет ИНДИГО, аккаунт конкурсанта',
    path: '/register',
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    contactPosition: '',
    email: '',
    phone: '',
    vkLink: '',
    city: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.contactPosition || !formData.email || !formData.phone || !formData.vkLink || !formData.city || !formData.password) {
      toast({ title: 'Заполните все поля', variant: 'destructive' });
      return;
    }
    if (formData.password.length < 6) {
      toast({ title: 'Пароль слишком короткий', description: 'Минимум 6 символов', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${REGISTER_URL}?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('participantEmail', formData.email);
        localStorage.setItem('participantData', JSON.stringify(data));
        toast({ title: 'Аккаунт создан!', description: 'Добро пожаловать в личный кабинет' });

        const contestId = searchParams.get('contest');
        navigate(contestId ? `/participant-cabinet?apply=${contestId}` : '/participant-cabinet');
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось создать аккаунт', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка соединения', description: 'Проверьте интернет и попробуйте снова', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Регистрация участника
            </h1>
            <p className="text-muted-foreground text-lg">
              Создайте аккаунт, чтобы подавать заявки на конкурсы из личного кабинета
            </p>
          </div>

          <Card className="p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <form onSubmit={handleSubmit}>
              <RegisterStepPersonal formData={formData} setFormData={setFormData} />

              <Button
                type="submit"
                className="w-full mt-6 bg-secondary hover:bg-secondary/90"
                size="lg"
                disabled={submitting}
              >
                {submitting ? (
                  <><Icon name="Loader2" size={18} className="mr-2 animate-spin" />Создание аккаунта...</>
                ) : (
                  <><Icon name="UserPlus" size={18} className="mr-2" />Зарегистрироваться</>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Уже есть аккаунт?{' '}
                <Button type="button" variant="link" className="text-secondary p-0 h-auto" onClick={() => navigate('/participant-login')}>
                  Войти
                </Button>
              </p>
            </form>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RegisterPage;