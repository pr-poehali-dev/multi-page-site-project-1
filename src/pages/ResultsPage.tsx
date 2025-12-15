import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

const ResultsPage = () => {
  const pastContests = [
    {
      title: 'Зимний конкурс пианистов 2024',
      date: 'Декабрь 2024',
      winners: [
        { place: 1, name: 'Анна Белова', city: 'Москва', prize: '500 000 ₽' },
        { place: 2, name: 'Михаил Орлов', city: 'Санкт-Петербург', prize: '300 000 ₽' },
        { place: 3, name: 'Елена Краснова', city: 'Казань', prize: '200 000 ₽' },
      ],
    },
    {
      title: 'Осенний вокальный конкурс 2024',
      date: 'Октябрь 2024',
      winners: [
        { place: 1, name: 'Ольга Соколова', city: 'Екатеринбург', prize: '400 000 ₽' },
        { place: 2, name: 'Дмитрий Васильев', city: 'Новосибирск', prize: '250 000 ₽' },
        { place: 3, name: 'Мария Федорова', city: 'Ростов-на-Дону', prize: '150 000 ₽' },
      ],
    },
  ];

  const getMedalColor = (place: number) => {
    switch (place) {
      case 1: return 'bg-yellow-400';
      case 2: return 'bg-gray-400';
      case 3: return 'bg-orange-400';
      default: return 'bg-muted';
    }
  };

  const getMedalEmoji = (place: number) => {
    switch (place) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏆';
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 text-center animate-fade-in">
            Итоги конкурсов
          </h1>
          <p className="text-xl text-muted-foreground text-center mb-12 animate-fade-in">
            Поздравляем победителей прошедших конкурсов
          </p>

          <div className="max-w-5xl mx-auto space-y-12">
            {pastContests.map((contest, contestIndex) => (
              <div
                key={contestIndex}
                className="animate-fade-in"
                style={{ animationDelay: `${contestIndex * 0.2}s` }}
              >
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-secondary text-white p-8">
                    <h2 className="text-3xl font-heading font-bold mb-2">{contest.title}</h2>
                    <div className="flex items-center gap-2 text-white/90">
                      <Icon name="Calendar" size={18} />
                      <span>{contest.date}</span>
                    </div>
                  </div>

                  <div className="p-8 space-y-4">
                    {contest.winners.map((winner, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-6 p-6 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className={`w-16 h-16 ${getMedalColor(winner.place)} rounded-full flex items-center justify-center text-3xl flex-shrink-0`}>
                          {getMedalEmoji(winner.place)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-heading font-semibold">{winner.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {winner.place} место
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Icon name="MapPin" size={14} />
                              <span>{winner.city}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Icon name="Award" size={14} />
                              <span className="font-semibold text-secondary">{winner.prize}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center bg-muted/30 rounded-3xl p-12 max-w-3xl mx-auto">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-heading font-bold mb-4">
              Хотите стать следующим победителем?
            </h3>
            <p className="text-muted-foreground mb-6">
              Регистрируйтесь на открытые конкурсы и покажите свой талант
            </p>
            <a 
              href="/contests" 
              className="inline-block px-8 py-3 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors font-semibold"
            >
              Посмотреть конкурсы
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ResultsPage;
