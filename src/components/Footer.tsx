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
                <Icon name="Instagram" size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Icon name="Facebook" size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Icon name="Youtube" size={20} />
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