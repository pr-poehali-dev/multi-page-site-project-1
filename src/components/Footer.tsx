import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <img 
              src="https://cdn.poehali.dev/files/лого 2.png" 
              alt="ИНДИГО" 
              className="h-24 w-auto mb-4"
            />
            <p className="text-sm opacity-90">Объединяем таланты!</p>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Навигация</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="opacity-90 hover:opacity-100 transition-opacity">Главная</Link></li>
              <li><Link to="/about" className="opacity-90 hover:opacity-100 transition-opacity">О нас</Link></li>
              <li><Link to="/contests" className="opacity-90 hover:opacity-100 transition-opacity">Конкурсы</Link></li>
              <li><Link to="/contacts" className="opacity-90 hover:opacity-100 transition-opacity">Контакты</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Информация</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/jury" className="opacity-90 hover:opacity-100 transition-opacity">Жюри</Link></li>
              <li><Link to="/gallery" className="opacity-90 hover:opacity-100 transition-opacity">Галерея</Link></li>
              <li><Link to="/results" className="opacity-90 hover:opacity-100 transition-opacity">Итоги</Link></li>
              <li><Link to="/sponsors" className="opacity-90 hover:opacity-100 transition-opacity">Партнёры</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Соцсети</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M15.07 2H8.93A6.93 6.93 0 002 8.93v6.14A6.93 6.93 0 008.93 22h6.14A6.93 6.93 0 0022 15.07V8.93A6.93 6.93 0 0015.07 2zm3.38 12.21c-.93 2.48-2.87 3.16-6.45 3.16s-5.52-.68-6.45-3.16c-.32-.85-.48-1.8-.48-3.21s.16-2.36.48-3.21C6.48 5.31 8.42 4.63 12 4.63s5.52.68 6.45 3.16c.32.85.48 1.8.48 3.21s-.16 2.36-.48 3.21z"/>
                  <path d="M9.85 8.85v6.3l5.5-3.15-5.5-3.15z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Icon name="Send" size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm opacity-75">© 2025 "ИНДИГО". Все права защищены</div>
      </div>
    </footer>
  );
};

export default Footer;