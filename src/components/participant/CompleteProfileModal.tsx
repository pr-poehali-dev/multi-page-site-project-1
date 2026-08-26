import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Participant } from './ParticipantHeader';

const AUTH_URL = 'https://functions.poehali.dev/52234468-777f-4edf-ba7a-985257092904';

interface CompleteProfileModalProps {
  open: boolean;
  onComplete: (participant: Participant) => void;
}

const CompleteProfileModal = ({ open, onComplete }: CompleteProfileModalProps) => {
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [contactPosition, setContactPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !city.trim() || !contactPosition.trim()) {
      toast({ title: 'Заполните все поля', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('participantToken');
      const res = await fetch(`${AUTH_URL}?action=complete_profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ phone: phone.trim(), city: city.trim(), contactPosition: contactPosition.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const stored = localStorage.getItem('participantData');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.participant = data.participant;
        localStorage.setItem('participantData', JSON.stringify(parsed));
      }
      toast({ title: 'Профиль дополнен', description: 'Спасибо! Теперь всё готово.' });
      onComplete(data.participant);
    } catch (e: unknown) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md [&>button]:hidden" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <Icon name="UserCheck" size={40} className="text-secondary" />
          </div>
          <DialogTitle className="text-center text-xl">Осталось совсем немного</DialogTitle>
          <DialogDescription className="text-center">
            Вы вошли через ВКонтакте — дополните несколько полей, чтобы подавать заявки на конкурсы
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="cp-phone">Телефон</Label>
            <Input id="cp-phone" placeholder="+7 900 000-00-00" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-city">Город</Label>
            <Input id="cp-city" placeholder="Ваш город" value={city} onChange={(e) => setCity(e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-position">Должность контактного лица</Label>
            <Input id="cp-position" placeholder="Например: руководитель коллектива" value={contactPosition} onChange={(e) => setContactPosition(e.target.value)} disabled={loading} />
          </div>
          <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90" disabled={loading}>
            {loading ? <><Icon name="Loader2" size={18} className="mr-2 animate-spin" />Сохранение...</> : 'Продолжить'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteProfileModal;