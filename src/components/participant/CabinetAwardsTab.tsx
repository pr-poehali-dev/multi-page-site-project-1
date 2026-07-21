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
  'ОБЛАДАТЕЛЯ ГРАН-ПРИ': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'ЛАУРЕАТА I СТЕПЕНИ': 'bg-amber-100 text-amber-800 border-amber-300',
  'ЛАУРЕАТА II СТЕПЕНИ': 'bg-orange-100 text-orange-800 border-orange-300',
  'ЛАУРЕАТА III СТЕПЕНИ': 'bg-blue-100 text-blue-800 border-blue-300',
  'ДИПЛОМАНТА I СТЕПЕНИ': 'bg-teal-100 text-teal-800 border-teal-300',
  'ДИПЛОМАНТА II СТЕПЕНИ': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'ДИПЛОМАНТА III СТЕПЕНИ': 'bg-sky-100 text-sky-800 border-sky-300',
  'УЧАСТНИКА': 'bg-gray-100 text-gray-700 border-gray-300',
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
                      <p className="text-sm text-muted-foreground font-mono mb-1.5">{d.diploma_number}</p>
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
                      <Icon name="ExternalLink" size={16} className="mr-1.5" /> Открыть диплом
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