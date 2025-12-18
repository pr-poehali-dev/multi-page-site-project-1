import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface JuryMember {
  id: number;
  name: string;
  role: string;
  specialty: string;
  bio: string;
  image_url: string | null;
  sort_order: number;
}

const JuryPage = () => {
  const [jury, setJury] = useState<JuryMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJury();
  }, []);

  const loadJury = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/29a5a3ab-7964-41f0-baf5-d85b81b743bc');
      const data = await response.json();
      setJury(data.jury_members || []);
    } catch (error) {
      console.error('Ошибка загрузки жюри:', error);
    } finally {
      setLoading(false);
    }
  };

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

          {loading ? (
            <div className="text-center py-12">
              <Icon name="Loader" size={48} className="mx-auto mb-4 animate-spin text-secondary" />
              <p className="text-muted-foreground">Загрузка жюри...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {jury.map((member, index) => (
                <Card
                  key={member.id}
                  className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-gradient-to-br from-primary/10 to-secondary/10 h-48 flex items-center justify-center">
                    {member.image_url ? (
                      <img 
                        src={member.image_url} 
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon name="User" size={64} className="text-muted-foreground" />
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-heading font-bold mb-1">{member.name}</h3>
                    <p className="text-secondary font-medium text-sm mb-2">{member.role}</p>
                    <div className="inline-block px-3 py-1 bg-muted text-xs font-semibold rounded-full mb-4">
                      {member.specialty}
                    </div>
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {member.bio}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default JuryPage;