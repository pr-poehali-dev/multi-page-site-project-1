import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const PARTICIPANT_AUTH_URL = 'https://functions.poehali.dev/52234468-777f-4edf-ba7a-985257092904';
const RESET_PASSWORD_URL = 'https://functions.poehali.dev/58c43074-f156-4b89-af2b-0a1c4f3366c7';

type Mode = 'login' | 'reset-request' | 'reset-confirm';

const ParticipantLoginPage = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contestId = searchParams.get('contest');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Ошибка', description: 'Введите email и пароль', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(PARTICIPANT_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('participantEmail', email);
        localStorage.setItem('participantData', JSON.stringify(data));
        toast({ title: 'Вход выполнен', description: `Добро пожаловать, ${data.participant.full_name}!` });
        navigate(contestId ? `/participant-cabinet?apply=${contestId}` : '/participant-cabinet');
      } else if (response.status === 403) {
        const error = await response.json();
        toast({ title: 'Пароль не установлен', description: error.message || 'Для входа необходимо подать новую заявку с установкой пароля', variant: 'destructive', duration: 7000 });
      } else {
        const error = await response.json();
        toast({ title: 'Ошибка входа', description: error.error || 'Неверный email или пароль', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось выполнить вход', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({ title: 'Ошибка', description: 'Введите email', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(RESET_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email: resetEmail })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Код отправлен', description: 'Проверьте почту — мы выслали 6-значный код' });
        setMode('reset-confirm');
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось отправить код', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка соединения', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || !newPassword || !newPasswordConfirm) {
      toast({ title: 'Заполните все поля', variant: 'destructive' });
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      toast({ title: 'Пароли не совпадают', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(RESET_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', email: resetEmail, code: resetCode, new_password: newPassword })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Пароль изменён', description: 'Теперь вы можете войти с новым паролем' });
        setEmail(resetEmail);
        setMode('login');
        setResetCode('');
        setNewPassword('');
        setNewPasswordConfirm('');
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось сменить пароль', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка соединения', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-md">

          {/* ── Вход ── */}
          {mode === 'login' && (
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-center mb-4">
                  <Icon name="UserCircle" size={48} className="text-secondary" />
                </div>
                <CardTitle className="text-2xl text-center">Вход для участников</CardTitle>
                <CardDescription className="text-center">
                  Введите email и пароль для доступа к личному кабинету
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Пароль</Label>
                    <Input id="password" type="password" placeholder="Ваш пароль" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                  </div>
                  <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90" disabled={loading}>
                    {loading ? <><Icon name="Loader2" size={18} className="mr-2 animate-spin" />Вход...</> : <><Icon name="LogIn" size={18} className="mr-2" />Войти</>}
                  </Button>
                  <div className="text-center">
                    <Button type="button" variant="link" className="text-muted-foreground text-sm h-auto p-0" onClick={() => { setResetEmail(email); setMode('reset-request'); }}>
                      Забыли пароль?
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {mode === 'login' && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">Еще нет аккаунта?</p>
              <Button
                type="button"
                size="lg"
                className="w-full bg-secondary hover:bg-secondary/90 text-lg"
                onClick={() => navigate(contestId ? `/register?contest=${contestId}` : '/register')}
              >
                <Icon name="UserPlus" size={20} className="mr-2" />
                Зарегистрироваться
              </Button>
            </div>
          )}

          {/* ── Запрос кода ── */}
          {mode === 'reset-request' && (
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-center mb-4">
                  <Icon name="KeyRound" size={48} className="text-secondary" />
                </div>
                <CardTitle className="text-2xl text-center">Восстановление пароля</CardTitle>
                <CardDescription className="text-center">
                  Введите email — мы отправим код для сброса пароля
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetRequest} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input id="reset-email" type="email" placeholder="your@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} disabled={loading} />
                  </div>
                  <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90" disabled={loading}>
                    {loading ? <><Icon name="Loader2" size={18} className="mr-2 animate-spin" />Отправка...</> : <><Icon name="Send" size={18} className="mr-2" />Отправить код</>}
                  </Button>
                  <div className="text-center">
                    <Button type="button" variant="link" className="text-muted-foreground text-sm" onClick={() => setMode('login')}>
                      <Icon name="ArrowLeft" size={14} className="mr-1" /> Назад ко входу
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* ── Подтверждение кода и новый пароль ── */}
          {mode === 'reset-confirm' && (
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-center mb-4">
                  <Icon name="ShieldCheck" size={48} className="text-secondary" />
                </div>
                <CardTitle className="text-2xl text-center">Новый пароль</CardTitle>
                <CardDescription className="text-center">
                  Введите код из письма и задайте новый пароль
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetConfirm} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-code">Код из письма</Label>
                    <Input id="reset-code" type="text" placeholder="123456" maxLength={6} value={resetCode} onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))} disabled={loading} className="text-center text-2xl font-mono tracking-widest" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Новый пароль</Label>
                    <Input id="new-password" type="password" placeholder="Минимум 6 символов" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password-confirm">Повторите пароль</Label>
                    <Input id="new-password-confirm" type="password" placeholder="Повторите пароль" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} disabled={loading} />
                  </div>
                  <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90" disabled={loading}>
                    {loading ? <><Icon name="Loader2" size={18} className="mr-2 animate-spin" />Сохранение...</> : <><Icon name="Check" size={18} className="mr-2" />Сохранить пароль</>}
                  </Button>
                  <div className="text-center flex justify-between text-sm">
                    <Button type="button" variant="link" className="text-muted-foreground p-0 h-auto" onClick={() => setMode('reset-request')}>
                      Отправить код снова
                    </Button>
                    <Button type="button" variant="link" className="text-muted-foreground p-0 h-auto" onClick={() => setMode('login')}>
                      <Icon name="ArrowLeft" size={14} className="mr-1" /> Ко входу
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ParticipantLoginPage;