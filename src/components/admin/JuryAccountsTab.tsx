import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface JuryMember {
  id: number;
  name: string;
  login?: string | null;
}

interface JuryAccountsTabProps {
  juryMembers: JuryMember[];
  loading: boolean;
  onSetCredentials: (juryId: number, login: string, password: string) => void;
}

const JuryAccountsTab = ({ juryMembers, loading, onSetCredentials }: JuryAccountsTabProps) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>, juryId: number) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const login = formData.get('login') as string;
    const password = formData.get('password') as string;
    
    if (login && password) {
      onSetCredentials(juryId, login, password);
      e.currentTarget.reset();
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Icon name="Loader" size={48} className="mx-auto mb-4 animate-spin text-secondary" />
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-heading font-bold mb-2">Управление доступами жюри</h2>
        <p className="text-muted-foreground">
          Установите логины и пароли для членов жюри для доступа к панели оценивания
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {juryMembers.map((member) => (
          <Card key={member.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-heading font-bold text-lg">{member.name}</h3>
                {member.login && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Текущий логин: <span className="font-mono text-primary">{member.login}</span>
                  </p>
                )}
              </div>
              {member.login ? (
                <Icon name="CheckCircle" size={20} className="text-green-600" />
              ) : (
                <Icon name="AlertCircle" size={20} className="text-yellow-600" />
              )}
            </div>

            <form onSubmit={(e) => handleSubmit(e, member.id)} className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Логин
                </label>
                <Input
                  name="login"
                  type="text"
                  placeholder="Введите логин"
                  defaultValue={member.login || ''}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  {member.login ? 'Новый пароль' : 'Пароль'}
                </label>
                <Input
                  name="password"
                  type="password"
                  placeholder="Введите пароль"
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/90"
              >
                <Icon name="Save" size={18} className="mr-2" />
                {member.login ? 'Обновить доступ' : 'Создать доступ'}
              </Button>
            </form>
          </Card>
        ))}
      </div>

      {juryMembers.length === 0 && (
        <div className="text-center py-12">
          <Icon name="Users" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Сначала добавьте членов жюри во вкладке "Жюри"
          </p>
        </div>
      )}
    </div>
  );
};

export default JuryAccountsTab;
