import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

type ParticipantData = {
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  city: string;
  contestId: string;
  category: string;
  experience: string;
  achievements: string;
  additionalInfo: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  files: File[];
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<ParticipantData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('participantData');
    if (stored) {
      setData(JSON.parse(stored));
    } else {
      toast({
        title: 'Нет данных',
        description: 'Сначала заполните форму регистрации',
        variant: 'destructive',
      });
      navigate('/register');
    }
  }, [navigate, toast]);

  if (!data) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">⏳ На рассмотрении</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">✅ Одобрено</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">❌ Отклонено</Badge>;
      default:
        return <Badge>Неизвестно</Badge>;
    }
  };

  const contestNames: Record<string, string> = {
    'winter-piano': 'Зимний конкурс пианистов 2025',
    'spring-vocal': 'Весенний вокальный конкурс 2025',
    'dance-festival': 'Танцевальный фестиваль 2025',
    'art-competition': 'Конкурс изобразительного искусства',
  };

  const categoryNames: Record<string, string> = {
    'junior': 'Юниоры (до 14 лет)',
    'youth': 'Молодёжь (15-18 лет)',
    'adult': 'Взрослые (19-25 лет)',
    'professional': 'Профессионалы (25+ лет)',
  };

  const experienceNames: Record<string, string> = {
    'beginner': 'Начинающий (менее 1 года)',
    'intermediate': 'Средний (1-3 года)',
    'advanced': 'Продвинутый (3-5 лет)',
    'expert': 'Эксперт (более 5 лет)',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Личный кабинет
            </h1>
            <p className="text-muted-foreground text-lg">
              Управляйте своими заявками и данными
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6 animate-fade-in">
              <Card className="p-6">
                <div className="text-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                    {data.fullName.charAt(0)}
                  </div>
                  <h2 className="text-xl font-heading font-bold mb-1">{data.fullName}</h2>
                  <p className="text-sm text-muted-foreground">{data.email}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Icon name="Phone" size={16} className="text-muted-foreground" />
                    <span>{data.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Icon name="MapPin" size={16} className="text-muted-foreground" />
                    <span>{data.city}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Icon name="Calendar" size={16} className="text-muted-foreground" />
                    <span>{new Date(data.birthDate).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-6" onClick={() => navigate('/register')}>
                  <Icon name="Edit" size={18} className="mr-2" />
                  Редактировать профиль
                </Button>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10">
                <h3 className="font-heading font-bold mb-3 flex items-center gap-2">
                  <Icon name="Trophy" size={20} className="text-primary" />
                  Статистика
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Заявок подано:</span>
                    <span className="font-semibold">1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Конкурсов:</span>
                    <span className="font-semibold">1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Файлов:</span>
                    <span className="font-semibold">{data.files?.length || 0}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <Tabs defaultValue="application" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="application">Заявка</TabsTrigger>
                  <TabsTrigger value="files">Файлы</TabsTrigger>
                  <TabsTrigger value="status">Статус</TabsTrigger>
                </TabsList>

                {/* Заявка */}
                <TabsContent value="application">
                  <Card className="p-6">
                    <h3 className="text-2xl font-heading font-bold mb-6">
                      Информация о заявке
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Конкурс
                        </h4>
                        <p className="text-lg">{contestNames[data.contestId]}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                            Категория
                          </h4>
                          <p>{categoryNames[data.category]}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                            Опыт
                          </h4>
                          <p>{experienceNames[data.experience] || 'Не указан'}</p>
                        </div>
                      </div>

                      {data.achievements && (
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                            Достижения
                          </h4>
                          <p className="text-sm whitespace-pre-wrap bg-muted/30 p-4 rounded-lg">
                            {data.achievements}
                          </p>
                        </div>
                      )}

                      {data.additionalInfo && (
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                            Дополнительная информация
                          </h4>
                          <p className="text-sm whitespace-pre-wrap bg-muted/30 p-4 rounded-lg">
                            {data.additionalInfo}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </TabsContent>

                {/* Файлы */}
                <TabsContent value="files">
                  <Card className="p-6">
                    <h3 className="text-2xl font-heading font-bold mb-6">
                      Загруженные файлы
                    </h3>

                    {data.files && data.files.length > 0 ? (
                      <div className="space-y-3">
                        {data.files.map((file: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                              <Icon name="File" size={24} className="text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Файл {index + 1}</p>
                              <p className="text-sm text-muted-foreground">Загружено успешно</p>
                            </div>
                            <Button variant="ghost" size="icon">
                              <Icon name="Download" size={18} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Icon name="FileX" size={48} className="mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Файлы не загружены</p>
                      </div>
                    )}
                  </Card>
                </TabsContent>

                {/* Статус */}
                <TabsContent value="status">
                  <Card className="p-6">
                    <h3 className="text-2xl font-heading font-bold mb-6">
                      Статус заявки
                    </h3>

                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">
                          {data.status === 'pending' && '⏳'}
                          {data.status === 'approved' && '🎉'}
                          {data.status === 'rejected' && '😔'}
                        </div>
                        <div>
                          <div className="mb-2">{getStatusBadge(data.status)}</div>
                          <p className="text-sm text-muted-foreground">
                            Подано: {new Date(data.submittedAt).toLocaleString('ru-RU')}
                          </p>
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded-lg p-6">
                        <h4 className="font-semibold mb-3">Этапы рассмотрения</h4>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                              <Icon name="Check" size={16} />
                            </div>
                            <div>
                              <p className="font-medium">Заявка получена</p>
                              <p className="text-xs text-muted-foreground">Ваша заявка принята в обработку</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white animate-pulse">
                              <Icon name="Clock" size={16} />
                            </div>
                            <div>
                              <p className="font-medium">Проверка документов</p>
                              <p className="text-xs text-muted-foreground">Жюри проверяет ваши материалы</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                              <Icon name="Mail" size={16} className="text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-muted-foreground">Уведомление о решении</p>
                              <p className="text-xs text-muted-foreground">Результат придет на email</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Icon name="Info" size={20} className="text-primary flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-semibold mb-1">Что дальше?</p>
                            <p className="text-muted-foreground">
                              Мы проверим вашу заявку в течение 3 рабочих дней. 
                              Результат придет на указанный email. При одобрении вы получите 
                              дальнейшие инструкции по участию в конкурсе.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProfilePage;
