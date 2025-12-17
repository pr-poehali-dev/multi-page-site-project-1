import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

type TabType = 'applications' | 'contests' | 'concerts' | 'jury' | 'jury-accounts' | 'scoring' | 'gallery' | 'results' | 'partners';

interface AdminTabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
}

const AdminTabNavigation = ({ activeTab, onTabChange, onLogout }: AdminTabNavigationProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-heading font-bold mb-2">
            Админ-панель жюри
          </h1>
          <p className="text-muted-foreground">
            Управление заявками и конкурсами
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={onLogout}
        >
          <Icon name="LogOut" className="mr-2 h-4 w-4" />
          Выйти
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mt-6">
        <Button
          variant={activeTab === 'applications' ? 'default' : 'outline'}
          onClick={() => onTabChange('applications')}
        >
          <Icon name="FileText" className="mr-2 h-4 w-4" />
          Заявки
        </Button>
        <Button
          variant={activeTab === 'contests' ? 'default' : 'outline'}
          onClick={() => onTabChange('contests')}
        >
          <Icon name="Trophy" className="mr-2 h-4 w-4" />
          Конкурсы
        </Button>
        <Button
          variant={activeTab === 'concerts' ? 'default' : 'outline'}
          onClick={() => onTabChange('concerts')}
        >
          <Icon name="Music" className="mr-2 h-4 w-4" />
          Концерты
        </Button>
        <Button
          variant={activeTab === 'jury' ? 'default' : 'outline'}
          onClick={() => onTabChange('jury')}
        >
          <Icon name="Users" className="mr-2 h-4 w-4" />
          Жюри
        </Button>
        <Button
          variant={activeTab === 'jury-accounts' ? 'default' : 'outline'}
          onClick={() => onTabChange('jury-accounts')}
        >
          <Icon name="UserCog" className="mr-2 h-4 w-4" />
          Аккаунты
        </Button>
        <Button
          variant={activeTab === 'scoring' ? 'default' : 'outline'}
          onClick={() => onTabChange('scoring')}
        >
          <Icon name="ClipboardCheck" className="mr-2 h-4 w-4" />
          Оценивание
        </Button>
        <Button
          variant={activeTab === 'gallery' ? 'default' : 'outline'}
          onClick={() => onTabChange('gallery')}
        >
          <Icon name="Image" className="mr-2 h-4 w-4" />
          Галерея
        </Button>
        <Button
          variant={activeTab === 'results' ? 'default' : 'outline'}
          onClick={() => onTabChange('results')}
        >
          <Icon name="Award" className="mr-2 h-4 w-4" />
          Результаты
        </Button>
        <Button
          variant={activeTab === 'partners' ? 'default' : 'outline'}
          onClick={() => onTabChange('partners')}
        >
          <Icon name="Handshake" className="mr-2 h-4 w-4" />
          Партнёры
        </Button>
      </div>
    </div>
  );
};

export default AdminTabNavigation;