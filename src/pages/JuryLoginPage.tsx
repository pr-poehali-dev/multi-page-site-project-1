import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

const JuryLoginPage = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/e399905c-0871-434d-90ae-850d12af1c0d?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('jury_token', data.token);
        localStorage.setItem('jury_name', data.name);
        localStorage.setItem('jury_id', data.jury_id.toString());
        navigate('/jury-panel');
      } else {
        setError(data.error || 'Ошибка входа');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="flex-grow flex items-center justify-center px-4 py-20">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 mb-4">
              <Icon name="ShieldCheck" size={32} className="text-secondary" />
            </div>
            <h1 className="text-3xl font-heading font-bold mb-2">Вход для жюри</h1>
            <p className="text-muted-foreground">
              Войдите для доступа к панели оценивания
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Логин
              </label>
              <Input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Введите логин"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Пароль
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <Icon name="AlertCircle" size={18} className="text-red-600 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-secondary hover:bg-secondary/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icon name="Loader" size={18} className="mr-2 animate-spin" />
                  Вход...
                </>
              ) : (
                <>
                  <Icon name="LogIn" size={18} className="mr-2" />
                  Войти
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Не можете войти? Обратитесь к администратору
            </p>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default JuryLoginPage;
