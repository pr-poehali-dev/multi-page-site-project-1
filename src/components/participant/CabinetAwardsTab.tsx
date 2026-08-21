import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export interface Diploma {
  diploma_number: string;
  participant_name: string;
  director_name: string;
  directing_party: string;
  piece_title: string;
  nomination: string;
  award: string;
  order_number?: number;
  contest_title: string;
  contest_location: string;
  contest_event_date: string;
}

const AWARD_COLORS: Record<string, string> = {
  'ОБЛАДАТЕЛЯ ГРАН-ПРИ': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'ЛАУРЕАТА I СТЕПЕНИ': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'ЛАУРЕАТА II СТЕПЕНИ': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'ЛАУРЕАТА III СТЕПЕНИ': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'ДИПЛОМАНТА I СТЕПЕНИ': 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  'ДИПЛОМАНТА II СТЕПЕНИ': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  'ДИПЛОМАНТА III СТЕПЕНИ': 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  'УЧАСТНИКА': 'bg-muted text-muted-foreground',
};

interface CabinetAwardsTabProps {
  diplomas: Diploma[];
  diplomasLoading: boolean;
}

const CabinetAwardsTab = ({ diplomas, diplomasLoading }: CabinetAwardsTabProps) => {
  const navigate = useNavigate();

  return (
    <>
      <h2 className="text-2xl font-heading font-bold mb-6">Мои награды и дипломы</h2>
      {diplomasLoading ? (
        <div className="text-center py-16">
          <Icon name="Loader2" size={40} className="mx-auto animate-spin text-muted-foreground" />
        </div>
      ) : diplomas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon name="Award" size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground mb-2">Дипломов пока нет</p>
            <p className="text-sm text-muted-foreground">Они появятся здесь после подведения итогов конкурса</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {diplomas.map((d) => (
            <Card key={d.diploma_number} className="overflow-hidden">
              <div className="border-l-4 border-secondary pl-0">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="text-xl">{d.contest_title}</CardTitle>
                      {d.contest_event_date && (
                        <CardDescription className="text-base">{d.contest_event_date}</CardDescription>
                      )}
                    </div>
                    {d.award && (
                      <span className={`shrink-0 px-4 py-1.5 rounded-xl text-base font-bold border ${AWARD_COLORS[d.award] || 'bg-muted text-muted-foreground border-border'}`}>
                        {d.award}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-3 py-2 w-fit">
                      <Icon name="Hash" size={16} className="shrink-0 opacity-80" />
                      <div>
                        <p className="text-[11px] opacity-80 leading-none mb-1">ID диплома для проверки</p>
                        <p className="font-mono font-semibold text-base leading-none">{d.diploma_number}</p>
                      </div>
                    </div>
                    {d.order_number != null && (
                      <div className="inline-flex items-center gap-2 bg-muted/60 border border-border rounded-lg px-3 py-2 w-fit">
                        <Icon name="ListOrdered" size={16} className="text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[11px] text-muted-foreground leading-none mb-1">Порядковый номер</p>
                          <p className="font-mono font-semibold text-base leading-none">{d.order_number}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Участник</p>
                      <p className="font-medium">{d.participant_name}</p>
                    </div>
                    {d.nomination && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Номинация</p>
                        <p className="font-medium">{d.nomination}</p>
                      </div>
                    )}
                    {d.piece_title && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Произведение</p>
                        <p className="font-medium">{d.piece_title}</p>
                      </div>
                    )}
                    {d.director_name && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Руководитель</p>
                        <p className="font-medium">{d.director_name}</p>
                      </div>
                    )}
                    {d.directing_party && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground mb-1">Направляющая сторона</p>
                        <p className="font-medium">{d.directing_party}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-5 pt-4 border-t flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => navigate(`/diploma-check?diploma_number=${d.diploma_number}`)}>
                      <Icon name="ExternalLink" size={16} className="mr-1.5" /> Проверить диплом по iD
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default CabinetAwardsTab;