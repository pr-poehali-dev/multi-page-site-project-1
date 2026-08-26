import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const PARTICIPANT_AUTH_URL = 'https://functions.poehali.dev/52234468-777f-4edf-ba7a-985257092904';
// Должен точно совпадать с redirect_uri, который отправлялся в VK при переходе на авторизацию
// (см. ParticipantLoginPage) — иначе VK откажет в обмене кода на токен.
const VK_CALLBACK_ORIGIN = 'https://xn----8sbhdtb7aluu.xn--p1ai';

const VkCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const deviceId = searchParams.get('device_id') || '';
    const contestId = localStorage.getItem('vkLoginContestId') || '';
    localStorage.removeItem('vkLoginContestId');

    const savedVerifier = sessionStorage.getItem('vkCodeVerifier') || '';
    const savedState = sessionStorage.getItem('vkState') || '';
    sessionStorage.removeItem('vkCodeVerifier');
    sessionStorage.removeItem('vkState');

    if (!code) {
      setError('Не удалось получить код авторизации от ВК');
      return;
    }
    if (!savedVerifier || (savedState && state && savedState !== state)) {
      setError('Сессия входа истекла. Попробуйте войти через ВК ещё раз.');
      return;
    }

    const isProdDomain = window.location.hostname.includes('индиго-арт.рф') || window.location.hostname.includes('xn----8sbhdtb7aluu');
    const origin = isProdDomain ? VK_CALLBACK_ORIGIN : window.location.origin;
    const redirectUri = `${origin}/vk-callback`;

    fetch(PARTICIPANT_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vk_login', code, redirect_uri: redirectUri, code_verifier: savedVerifier, device_id: deviceId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Ошибка входа через ВК');
        localStorage.setItem('participantEmail', data.participant.email);
        localStorage.setItem('participantData', JSON.stringify(data));
        if (data.token) localStorage.setItem('participantToken', data.token);
        toast({ title: 'Вход выполнен', description: `Добро пожаловать, ${data.participant.full_name}!` });

        if (!data.participant.profile_complete) {
          navigate(contestId ? `/participant-cabinet?complete_profile=1&apply=${contestId}` : '/participant-cabinet?complete_profile=1');
        } else {
          navigate(contestId ? `/participant-cabinet?apply=${contestId}` : '/participant-cabinet');
        }
      })
      .catch((e) => setError(e.message || 'Не удалось выполнить вход через ВК'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pt-32 pb-20 px-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          {error ? (
            <>
              <Icon name="AlertCircle" size={48} className="mx-auto mb-4 text-destructive" />
              <p className="text-lg font-medium mb-2">Не удалось войти через ВК</p>
              <p className="text-muted-foreground mb-6">{error}</p>
              <button
                className="text-secondary underline"
                onClick={() => navigate('/participant-login')}
              >
                Вернуться к входу
              </button>
            </>
          ) : (
            <>
              <Icon name="Loader2" size={48} className="mx-auto mb-4 text-secondary animate-spin" />
              <p className="text-lg font-medium">Выполняется вход через ВКонтакте...</p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VkCallbackPage;