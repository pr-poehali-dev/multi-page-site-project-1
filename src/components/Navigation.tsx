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
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Верхняя контактная полоса */}
      <div className="hidden sm:block bg-gradient-to-r from-primary via-primary to-secondary">
        <div className="mx-auto px-4 max-w-[1800px]">
          <div className="flex items-center justify-between h-9 text-white">
            <div className="flex items-center gap-5">
              <a href="mailto:info@индиго-арт.рф" className="flex items-center gap-1.5 text-xs font-medium opacity-90 hover:opacity-100 transition-opacity whitespace-nowrap">
                <Icon name="Mail" size={13} />
                info@индиго-арт.рф
              </a>
              <a href="tel:+79224154463" className="flex items-center gap-1.5 text-xs font-medium opacity-90 hover:opacity-100 transition-opacity whitespace-nowrap">
                <Icon name="Phone" size={13} />
                +7-922-415-4463
              </a>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <a href="https://vk.com/indigo_rf?from=groups" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M15.07 2H8.93A6.93 6.93 0 002 8.93v6.14A6.93 6.93 0 008.93 22h6.14A6.93 6.93 0 0022 15.07V8.93A6.93 6.93 0 0015.07 2zm3.38 12.21c-.93 2.48-2.87 3.16-6.45 3.16s-5.52-.68-6.45-3.16c-.32-.85-.48-1.8-.48-3.21s.16-2.36.48-3.21C6.48 5.31 8.42 4.63 12 4.63s5.52.68 6.45 3.16c.32.85.48 1.8.48 3.21s-.16 2.36-.48 3.21z"/>
                  <path d="M9.85 8.85v6.3l5.5-3.15-5.5-3.15z"/>
                </svg>
              </a>
              <a href="https://t.me/indigo_fest" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                <Icon name="Send" size={13} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Основная строка меню */}
      <div className="bg-white/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="mx-auto px-4 max-w-[1800px]">
          <div className="flex items-center justify-between h-20 py-2 gap-4">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img
                src="https://cdn.poehali.dev/projects/ecdaf1c5-6d12-4487-8a18-89243ebbcc9e/bucket/02cf2a9d-772a-4e52-a691-79f2bf6e4461.png"
                alt="ИНДИГО"
                className="h-14 w-auto object-contain"
              />
            </Link>

            <div className="hidden lg:flex items-center gap-1 xl:gap-1.5 mx-auto overflow-x-auto">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    location.pathname === link.path
                      ? 'bg-secondary/10 text-secondary'
                      : 'text-foreground hover:bg-muted hover:text-secondary'
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
              <div className="flex flex-col gap-2 mt-4 mb-4 p-3 rounded-xl bg-gradient-to-br from-primary to-secondary">
                <a href="mailto:info@индиго-арт.рф" className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Icon name="Mail" size={16} />
                  info@индиго-арт.рф
                </a>
                <a href="tel:+79224154463" className="flex items-center gap-2 text-sm font-semibold text-white">
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
      </div>
    </nav>
  );
};

export default Navigation;