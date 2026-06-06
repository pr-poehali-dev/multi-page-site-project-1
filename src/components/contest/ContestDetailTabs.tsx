import React from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Contest {
  id: number;
  title: string;
  end_date: string;
  rules?: string;
  prizes?: string;
  categories?: string;
  event_date?: string;
}

interface JuryMember {
  id: number;
  name: string;
  role: string;
  specialty?: string;
  image_url?: string;
  has_access: boolean;
}

interface ContestDetailTabsProps {
  contest: Contest;
  juryMembers: JuryMember[];
}

const renderFormattedText = (text: string) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key} className="space-y-1.5 mb-3">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList(`list-${idx}`);
      elements.push(<br key={`br-${idx}`} />);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      listItems.push(trimmed.replace(/^[-•]\s+/, ''));
    } else {
      flushList(`list-${idx}`);
      elements.push(<p key={`p-${idx}`} className="mb-1.5">{trimmed}</p>);
    }
  });
  flushList('list-end');
  return <div className="text-sm leading-relaxed">{elements}</div>;
};

const ContestDetailTabs = ({ contest, juryMembers }: ContestDetailTabsProps) => {
  const endDate = new Date(contest.end_date);

  return (
    <div className="p-8 md:p-12">
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8 bg-white/10">
          <TabsTrigger value="info" className="text-white data-[state=active]:text-primary data-[state=inactive]:text-white">
            <Icon name="Info" size={18} className="mr-2" />
            Информация
          </TabsTrigger>
          <TabsTrigger value="rules" className="text-white data-[state=active]:text-primary data-[state=inactive]:text-white">
            <Icon name="FileText" size={18} className="mr-2" />
            Правила
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-white data-[state=active]:text-primary data-[state=inactive]:text-white">
            <Icon name="List" size={18} className="mr-2" />
            Категории
          </TabsTrigger>
          <TabsTrigger value="prizes" className="text-white data-[state=active]:text-primary data-[state=inactive]:text-white">
            <Icon name="Trophy" size={18} className="mr-2" />
            Призы
          </TabsTrigger>
          <TabsTrigger value="jury" className="text-white data-[state=active]:text-primary data-[state=inactive]:text-white">
            <Icon name="Users" size={18} className="mr-2" />
            Жюри
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div>
            <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Icon name="Calendar" size={24} className="text-primary" />
              Даты проведения
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Icon name="CalendarDays" size={20} className="text-green-500" />
                  <h4 className="font-semibold">Дата проведения</h4>
                </div>
                <p className="text-2xl font-bold">
                  {contest.event_date || '—'}
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Icon name="CalendarX" size={20} className="text-red-500" />
                  <h4 className="font-semibold">Окончание приёма заявок</h4>
                </div>
                <p className="text-2xl font-bold">
                  {endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {endDate.toLocaleDateString('ru-RU', { weekday: 'long' })}
                </p>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Icon name="Users" size={24} className="text-primary" />
              Кто может участвовать
            </h3>
            <Card className="p-6">
              <p className="text-muted-foreground">
                В конкурсе могут принять участие все желающие независимо от возраста.
                Участники делятся на возрастные категории для справедливого оценивания.
              </p>
            </Card>
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Icon name="FileCheck" size={24} className="text-primary" />
              Как подать заявку
            </h3>
            <Card className="p-6">
              <ol className="space-y-3 list-decimal list-inside">
                <li>Заполните форму заявки на сайте</li>
                <li>Укажите свои контактные данные</li>
                <li>Выберите категорию участия</li>
                <li>Дождитесь подтверждения на email</li>
                <li>Следуйте инструкциям организаторов</li>
              </ol>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Общие правила</h3>
            {contest.rules ? (
              <div>{renderFormattedText(contest.rules)}</div>
            ) : (
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Icon name="Check" size={18} className="text-green-500 mt-1 flex-shrink-0" />
                  <span>Участие бесплатное</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" size={18} className="text-green-500 mt-1 flex-shrink-0" />
                  <span>Один участник может подать несколько заявок в разных категориях</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" size={18} className="text-green-500 mt-1 flex-shrink-0" />
                  <span>Все материалы должны быть авторскими</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" size={18} className="text-green-500 mt-1 flex-shrink-0" />
                  <span>Решение жюри является окончательным</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" size={18} className="text-green-500 mt-1 flex-shrink-0" />
                  <span>Результаты будут опубликованы на сайте</span>
                </li>
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Категории участия</h3>
            {contest.categories ? (
              <div>{renderFormattedText(contest.categories)}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Дети (до 12 лет)</h4>
                  <p className="text-sm text-muted-foreground">Младшая возрастная категория</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Подростки (13-17 лет)</h4>
                  <p className="text-sm text-muted-foreground">Средняя возрастная категория</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Молодёжь (18-25 лет)</h4>
                  <p className="text-sm text-muted-foreground">Старшая возрастная категория</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Взрослые (26+ лет)</h4>
                  <p className="text-sm text-muted-foreground">Взрослая категория</p>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="prizes" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Призовой фонд</h3>
            {contest.prizes ? (
              <div>{renderFormattedText(contest.prizes)}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 border-2 border-yellow-500/50 bg-yellow-500/5">
                  <div className="text-center">
                    <Icon name="Trophy" size={48} className="mx-auto mb-3 text-yellow-500" />
                    <h4 className="text-2xl font-bold mb-2">1 место</h4>
                    <p className="text-3xl font-bold text-yellow-600 mb-2">🥇</p>
                    <p className="text-sm text-muted-foreground">Диплом + Приз</p>
                  </div>
                </Card>
                <Card className="p-6 border-2 border-gray-400/50 bg-gray-400/5">
                  <div className="text-center">
                    <Icon name="Award" size={48} className="mx-auto mb-3 text-gray-500" />
                    <h4 className="text-2xl font-bold mb-2">2 место</h4>
                    <p className="text-3xl font-bold text-gray-500 mb-2">🥈</p>
                    <p className="text-sm text-muted-foreground">Диплом + Приз</p>
                  </div>
                </Card>
                <Card className="p-6 border-2 border-orange-500/50 bg-orange-500/5">
                  <div className="text-center">
                    <Icon name="Medal" size={48} className="mx-auto mb-3 text-orange-600" />
                    <h4 className="text-2xl font-bold mb-2">3 место</h4>
                    <p className="text-3xl font-bold text-orange-600 mb-2">🥉</p>
                    <p className="text-sm text-muted-foreground">Диплом + Приз</p>
                  </div>
                </Card>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-6 text-center">
              Все участники получают сертификаты участия
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="jury" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-6">Члены жюри</h3>
            {juryMembers.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Icon name="Users" size={40} className="mx-auto mb-3" />
                <p>Жюри ещё не назначено</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {juryMembers.map(member => (
                  <div key={member.id} className="flex flex-col items-center text-center gap-3">
                    {member.image_url ? (
                      <img
                        src={member.image_url}
                        alt={member.name}
                        className="w-40 h-40 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-40 h-40 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                        <Icon name="User" size={32} className="text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm leading-tight">{member.name}</p>
                      {member.specialty && <p className="text-xs text-muted-foreground mt-0.5">{member.specialty}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContestDetailTabs;
