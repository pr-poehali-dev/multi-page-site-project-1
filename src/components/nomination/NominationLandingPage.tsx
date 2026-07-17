import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';

interface SubCategory {
  title: string;
  description: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface NominationLandingPageProps {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  seoPath: string;
  icon: string;
  badge: string;
  heroTitle: string;
  heroSubtitle: string;
  introParagraphs: string[];
  subCategories: SubCategory[];
  ageCategories: string[];
  formats: string[];
  faq: FAQItem[];
}

const NominationLandingPage = ({
  seoTitle,
  seoDescription,
  seoKeywords,
  seoPath,
  icon,
  badge,
  heroTitle,
  heroSubtitle,
  introParagraphs,
  subCategories,
  ageCategories,
  formats,
  faq,
}: NominationLandingPageProps) => {
  useSEO({
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    path: seoPath,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-32 pb-16 px-4 md:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <Icon name={icon as any} size={36} className="text-white" />
          </div>
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-secondary/10 text-secondary mb-4 animate-fade-in">
            {badge}
          </span>
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-5 animate-fade-in bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in">
            {heroSubtitle}
          </p>
          <div className="flex flex-wrap gap-3 justify-center animate-fade-in">
            <Link to="/contests">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90">
                Смотреть конкурсы
              </Button>
            </Link>
            <Link to="/results">
              <Button size="lg" variant="outline">
                Итоги прошлых конкурсов
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-8 pb-16">
        <div className="max-w-4xl mx-auto space-y-6">
          {introParagraphs.map((p, i) => (
            <Card key={i} className="p-6 md:p-10 bg-gradient-to-br from-white to-muted/30 shadow-md">
              <p className="text-base md:text-lg leading-relaxed text-center">{p}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-4 md:px-8 pb-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-8 text-center">
            Номинации и жанры
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subCategories.map((cat, i) => (
              <Card
                key={i}
                className="p-6 hover:shadow-xl transition-all hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <h3 className="text-lg font-heading font-semibold mb-2 text-secondary">{cat.title}</h3>
                <p className="text-sm text-muted-foreground">{cat.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 md:px-8 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Icon name="Users" size={22} className="text-primary" />
              <h3 className="text-xl font-heading font-semibold">Возрастные категории</h3>
            </div>
            <ul className="space-y-2">
              {ageCategories.map((age, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon name="Check" size={16} className="text-secondary shrink-0" />
                  {age}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Icon name="Video" size={22} className="text-primary" />
              <h3 className="text-xl font-heading font-semibold">Форматы участия</h3>
            </div>
            <ul className="space-y-2">
              {formats.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon name="Check" size={16} className="text-secondary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="px-4 md:px-8 pb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-8 text-center">
            Частые вопросы
          </h2>
          <div className="space-y-4">
            {faq.map((item, i) => (
              <Card key={i} className="p-6">
                <h3 className="font-heading font-semibold mb-2 flex items-start gap-2">
                  <Icon name="CircleHelp" size={18} className="text-secondary mt-0.5 shrink-0" />
                  {item.question}
                </h3>
                <p className="text-sm text-muted-foreground pl-6">{item.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 md:px-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <Card className="p-10 md:p-14 text-center bg-gradient-to-br from-primary to-secondary text-white">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
              Готовы принять участие?
            </h2>
            <p className="mb-6 opacity-90 max-w-xl mx-auto">
              Выберите ближайший конкурс в календаре и подайте заявку — очно, заочно или онлайн.
            </p>
            <Link to="/contests">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                Перейти к конкурсам
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default NominationLandingPage;
