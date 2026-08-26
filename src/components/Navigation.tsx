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
      <div className="mx-auto px-4 max-w-[1800px]">
        <div className="flex items-center justify-between h-20 gap-4">
          <div className="hidden 2xl:flex flex-col justify-center gap-1 shrink-0 px-3 py-1.5 rounded-xl bg-gradient-to-br from-secondary/10 to-primary/10 border border-secondary/20">
            <a href="mailto:info@индиго-арт.рф" className="flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-secondary/80 transition-colors whitespace-nowrap">
              <Icon name="Mail" size={13} />
              info@индиго-арт.рф
            </a>
            <a href="tel:+79224154463" className="flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-secondary/80 transition-colors whitespace-nowrap">
              <Icon name="Phone" size={13} />
              +7-922-415-4463
            </a>
          </div>

          <div className="hidden lg:flex items-center gap-2.5 xl:gap-5 mx-auto overflow-x-auto">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-secondary whitespace-nowrap ${
                  location.pathname === link.path ? 'text-secondary' : 'text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <Link to="/participant-login" className="hidden lg:block shrink-0">
            <Button className="gap-2 bg-secondary hover:bg-secondary/90 shadow-md shadow-secondary/30">
              <Icon name="User" size={16} />
              Личный кабинет
            </Button>
          </Link>

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
            <div className="flex flex-col gap-2 mt-4 mb-4 p-3 rounded-xl bg-gradient-to-br from-secondary/10 to-primary/10 border border-secondary/20">
              <a href="mailto:info@индиго-арт.рф" className="flex items-center gap-2 text-sm font-bold text-secondary hover:text-secondary/80 transition-colors">
                <Icon name="Mail" size={16} />
                info@индиго-арт.рф
              </a>
              <a href="tel:+79224154463" className="flex items-center gap-2 text-sm font-bold text-secondary hover:text-secondary/80 transition-colors">
                <Icon name="Phone" size={16} />
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