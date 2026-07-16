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
  contest_title: string;
  contest_location: string;
  contest_event_date: string;
}

const AWARD_COLORS: Record<string, string> = {
  'ОБЛАДАТЕЛЬ ГРАН-ПРИ': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'ЛАУРЕАТ I СТЕПЕНИ': 'bg-amber-100 text-amber-800 border-amber-300',
  'ЛАУРЕАТ II СТЕПЕНИ': 'bg-orange-100 text-orange-800 border-orange-300',
  'ЛАУРЕАТ III СТЕПЕНИ': 'bg-blue-100 text-blue-800 border-blue-300',
  'ДИПЛОМАНТ I СТЕПЕНИ': 'bg-teal-100 text-teal-800 border-teal-300',
  'ДИПЛОМАНТ II СТЕПЕНИ': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'ДИПЛОМАНТ III СТЕПЕНИ': 'bg-sky-100 text-sky-800 border-sky-300',
  'УЧАСТНИК': 'bg-gray-100 text-gray-700 border-gray-300',
};

interface CabinetAwardsTabProps {
  diplomas: Diploma[];
  diplomasLoading: boolean;
}

const CabinetAwardsTab = ({ diplomas, diplomasLoading }: CabinetAwardsTabProps) => {
  const navigate = useNavigate();

  return (
    <>
      <h2 className="text-xl font-heading font-bold mb-4">Мои награды и дипломы</h2>
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
        <div className="space-y-4">
          {diplomas.map((d) => (
            <Card key={d.diploma_number} className="overflow-hidden">
              <div className="border-l-4 border-secondary pl-0">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-xs text-muted-foreground font-mono mb-1">{d.diploma_number}</p>
                      <CardTitle className="text-lg">{d.contest_title}</CardTitle>
                      {d.contest_event_date && (
                        <CardDescription>{d.contest_event_date}</CardDescription>
                      )}
                    </div>
                    {d.award && (
                      <span className={`shrink-0 px-3 py-1 rounded-xl text-sm font-bold border ${AWARD_COLORS[d.award] || 'bg-muted text-muted-foreground border-border'}`}>
                        {d.award}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Участник</p>
                      <p className="font-medium">{d.participant_name}</p>
                    </div>
                    {d.nomination && (
                      <div>
                        <p className="text-muted-foreground">Номинация</p>
                        <p className="font-medium">{d.nomination}</p>
                      </div>
                    )}
                    {d.piece_title && (
                      <div>
                        <p className="text-muted-foreground">Произведение</p>
                        <p className="font-medium">{d.piece_title}</p>
                      </div>
                    )}
                    {d.director_name && (
                      <div>
                        <p className="text-muted-foreground">Руководитель</p>
                        <p className="font-medium">{d.director_name}</p>
                      </div>
                    )}
                    {d.directing_party && (
                      <div className="md:col-span-2">
                        <p className="text-muted-foreground">Направляющая сторона</p>
                        <p className="font-medium">{d.directing_party}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/diploma-check?diploma_number=${d.diploma_number}`)}>
                      <Icon name="ExternalLink" size={14} className="mr-1" /> Открыть диплом
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