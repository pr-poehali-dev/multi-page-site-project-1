import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AdminAuthProps {
  onLogin: () => void;
}

const AdminAuth = ({ onLogin }: AdminAuthProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'J7G2gZCh') {
      onLogin();
      setError('');
    } else {
      setError('Неверный пароль');
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-md">
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="text-center mb-6">
              <Icon name="Shield" size={48} className="mx-auto mb-4 text-secondary" />
              <h1 className="text-3xl font-heading font-bold mb-2">
                Вход в админ-панель
              </h1>
              <p className="text-muted-foreground">
                Введите пароль для доступа
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Пароль"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
                {error && (
                  <p className="text-red-500 text-sm mt-2">{error}</p>
                )}
              </div>
              <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90">
                Войти
              </Button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminAuth;
