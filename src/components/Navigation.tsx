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
    { path: '/concerts', label: 'Афиша концертов' },
    { path: '/jury', label: 'Жюри' },
    { path: '/gallery', label: 'Галерея' },
    { path: '/sponsors', label: 'Нас поддерживают' },
    { path: '/results', label: 'Итоги конкурсов' },
    { path: '/contacts', label: 'Контакты' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center">
            <img 
              src="https://cdn.poehali.dev/files/лого 2.png" 
              alt="ИНДИГО" 
              className="h-16 w-auto"
            />
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
            <Link to="/register">
              <Button className="bg-secondary hover:bg-secondary/90">
                Участвовать
              </Button>
            </Link>
            <Link to="/participant-login">
              <Button variant="outline" size="sm" className="gap-2">
                <Icon name="User" size={16} />
                Личный кабинет
              </Button>
            </Link>
            <Link to="/jury-login">
              <Button variant="outline" size="sm" className="gap-2">
                <Icon name="UserCircle" size={16} />
                Вход для жюри
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="outline" size="sm" className="gap-2">
                <Icon name="Shield" size={16} />
                Админ
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
            <Link to="/register">
              <Button className="w-full mt-4 bg-secondary hover:bg-secondary/90">
                Участвовать
              </Button>
            </Link>
            <Link to="/participant-login">
              <Button variant="outline" className="w-full mt-2 gap-2">
                <Icon name="User" size={16} />
                Личный кабинет
              </Button>
            </Link>
            <Link to="/jury-login">
              <Button variant="outline" className="w-full mt-2 gap-2">
                <Icon name="UserCircle" size={16} />
                Вход для жюри
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="outline" className="w-full mt-2 gap-2">
                <Icon name="Shield" size={16} />
                Админ
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;