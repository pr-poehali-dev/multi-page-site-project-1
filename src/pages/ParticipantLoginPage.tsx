import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const PARTICIPANT_AUTH_URL = 'https://functions.poehali.dev/52234468-777f-4edf-ba7a-985257092904';

const ParticipantLoginPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Ошибка',
        description: 'Введите email',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${PARTICIPANT_AUTH_URL}?email=${encodeURIComponent(email)}`);
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('participantEmail', email);
        localStorage.setItem('participantData', JSON.stringify(data));
        
        toast({
          title: 'Вход выполнен',
          description: `Добро пожаловать, ${data.participant.full_name}!`
        });
        
        navigate('/participant-cabinet');
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка входа',
          description: error.error || 'Участник не найден',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось выполнить вход',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <Icon name="UserCircle" size={48} className="text-secondary" />
              </div>
              <CardTitle className="text-2xl text-center">Вход для участников</CardTitle>
              <CardDescription className="text-center">
                Введите email, который вы указали при регистрации
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-secondary hover:bg-secondary/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                      Вход...
                    </>
                  ) : (
                    <>
                      <Icon name="LogIn" size={18} className="mr-2" />
                      Войти
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <p>Еще не участвовали?</p>
                  <Button
                    type="button"
                    variant="link"
                    className="text-secondary"
                    onClick={() => navigate('/register')}
                  >
                    Подать заявку
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ParticipantLoginPage;
