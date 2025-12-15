import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';

const JuryPage = () => {
  const jury = [
    {
      name: 'Анна Петрова',
      role: 'Заслуженная артистка России',
      specialty: 'Вокал',
      bio: 'Солистка Большого театра, профессор консерватории. Лауреат международных конкурсов.',
      image: '👩‍🎤',
    },
    {
      name: 'Михаил Соколов',
      role: 'Народный артист России',
      specialty: 'Фортепиано',
      bio: 'Пианист с мировым именем, руководитель музыкальной академии.',
      image: '👨‍🎨',
    },
    {
      name: 'Елена Волкова',
      role: 'Хореограф-постановщик',
      specialty: 'Хореография',
      bio: 'Художественный руководитель балетной труппы, постановщик 50+ спектаклей.',
      image: '💃',
    },
    {
      name: 'Дмитрий Кузнецов',
      role: 'Дирижер',
      specialty: 'Оркестр',
      bio: 'Главный дирижер симфонического оркестра, лауреат премии Грэмми.',
      image: '🎼',
    },
    {
      name: 'Ольга Смирнова',
      role: 'Музыкальный критик',
      specialty: 'Теория музыки',
      bio: 'Доктор искусствоведения, автор 10 книг о современной музыке.',
      image: '📚',
    },
    {
      name: 'Игорь Новиков',
      role: 'Композитор',
      specialty: 'Композиция',
      bio: 'Автор музыки к 30 кинофильмам и театральным постановкам.',
      image: '🎹',
    },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 text-center animate-fade-in">
            Наше жюри
          </h1>
          <p className="text-xl text-muted-foreground text-center mb-12 max-w-3xl mx-auto animate-fade-in">
            Профессиональная оценка от признанных мастеров искусства
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {jury.map((member, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 h-48 flex items-center justify-center">
                  <div className="text-8xl">{member.image}</div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-heading font-bold mb-1">{member.name}</h3>
                  <p className="text-secondary font-medium text-sm mb-2">{member.role}</p>
                  <div className="inline-block px-3 py-1 bg-muted text-xs font-semibold rounded-full mb-4">
                    {member.specialty}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default JuryPage;
