import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const ContactsPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Сообщение отправлено!',
      description: 'Мы свяжемся с вами в ближайшее время.',
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contacts = [
    {
      icon: 'Mail',
      title: 'Email',
      value: 'info@art-seasons.ru',
      link: 'mailto:info@art-seasons.ru',
    },
    {
      icon: 'Phone',
      title: 'Телефон',
      value: '+7 (495) 123-45-67',
      link: 'tel:+74951234567',
    },
    {
      icon: 'MapPin',
      title: 'Адрес',
      value: 'Москва, ул. Тверская, 10',
      link: null,
    },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 text-center animate-fade-in">
            Контакты
          </h1>
          <p className="text-xl text-muted-foreground text-center mb-12 animate-fade-in">
            Свяжитесь с нами по любым вопросам
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div className="space-y-8 animate-fade-in">
              <Card className="p-8">
                <h2 className="text-2xl font-heading font-bold mb-6">
                  Напишите нам
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Ваше имя
                    </label>
                    <Input
                      placeholder="Иван Иванов"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="ivan@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Тема
                    </label>
                    <Input
                      placeholder="Вопрос о конкурсе"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Сообщение
                    </label>
                    <Textarea
                      placeholder="Опишите ваш вопрос..."
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90">
                    Отправить сообщение
                  </Button>
                </form>
              </Card>
            </div>

            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Card className="p-8">
                <h2 className="text-2xl font-heading font-bold mb-6">
                  Контактная информация
                </h2>

                <div className="space-y-6">
                  {contacts.map((contact, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon name={contact.icon as any} size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold mb-1">{contact.title}</h3>
                        {contact.link ? (
                          <a
                            href={contact.link}
                            className="text-muted-foreground hover:text-secondary transition-colors"
                          >
                            {contact.value}
                          </a>
                        ) : (
                          <p className="text-muted-foreground">{contact.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10">
                <h3 className="text-xl font-heading font-bold mb-4">
                  Социальные сети
                </h3>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="w-12 h-12 bg-white rounded-xl flex items-center justify-center hover:shadow-lg transition-shadow"
                  >
                    <Icon name="Instagram" size={24} className="text-primary" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-white rounded-xl flex items-center justify-center hover:shadow-lg transition-shadow"
                  >
                    <Icon name="Facebook" size={24} className="text-primary" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-white rounded-xl flex items-center justify-center hover:shadow-lg transition-shadow"
                  >
                    <Icon name="Youtube" size={24} className="text-primary" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-white rounded-xl flex items-center justify-center hover:shadow-lg transition-shadow"
                  >
                    <Icon name="Send" size={24} className="text-primary" />
                  </a>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactsPage;
