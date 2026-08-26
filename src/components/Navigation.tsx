import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { path: '/', label: 'Главная' },
    { path: '/about', label: 'О нас' },
    { path: '/contests', label: 'Календарь конкурсов' },
    { path: '/jury', label: 'Жюри' },
    { path: '/gallery', label: 'Галерея' },
    { path: '/sponsors', label: 'Нас поддерживают' },
    { path: '/results', label: 'Итоги конкурсов' },
    { path: '/diploma-check', label: 'Проверка диплома' },
    { path: '/reviews', label: 'Отзывы' },
    { path: '/contacts', label: 'Контакты' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
      <div className="hidden lg:flex items-center justify-end gap-6 px-4 py-1.5 bg-muted/40 border-b border-border/60 text-xs text-muted-foreground">
        <a href="mailto:info@индиго-арт.рф" className="flex items-center gap-1.5 hover:text-secondary transition-colors">
          <Icon name="Mail" size={13} />
          info@индиго-арт.рф
        </a>
        <a href="tel:+79224154463" className="flex items-center gap-1.5 hover:text-secondary transition-colors">
          <Icon name="Phone" size={13} />
          +7-922-415-4463
        </a>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center">
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-secondary ${
                  location.pathname === link.path ? 'text-secondary' : 'text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/participant-login">
              <Button className="gap-2 bg-secondary hover:bg-secondary/90 shadow-md shadow-secondary/30">
                <Icon name="User" size={16} />
                Личный кабинет
              </Button>
            </Link>
          </div>

          <button
            className="lg:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Icon name={isOpen ? 'X' : 'Menu'} size={24} />
          </button>
        </div>

        {isOpen && (
          <div className="lg:hidden py-4 animate-fade-in">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block py-3 text-sm font-medium transition-colors ${
                  location.pathname === link.path ? 'text-secondary' : 'text-foreground'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 mt-4 mb-2 text-sm text-muted-foreground">
              <a href="mailto:info@индиго-арт.рф" className="flex items-center gap-2 hover:text-secondary transition-colors">
                <Icon name="Mail" size={15} />
                info@индиго-арт.рф
              </a>
              <a href="tel:+79224154463" className="flex items-center gap-2 hover:text-secondary transition-colors">
                <Icon name="Phone" size={15} />
                +7-922-415-4463
              </a>
            </div>
            <Link to="/participant-login">
              <Button className="w-full gap-2 bg-secondary hover:bg-secondary/90">
                <Icon name="User" size={16} />
                Личный кабинет
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;