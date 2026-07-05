import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const STORAGE_KEY = 'cookieConsent';
const PRIVACY_POLICY_URL = 'https://cdn.poehali.dev/projects/ecdaf1c5-6d12-4487-8a18-89243ebbcc9e/bucket/c4d750a4-9bb5-41e4-8f14-48cde212cdbe.pdf';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in">
      <div className="container mx-auto max-w-4xl bg-primary text-primary-foreground rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4">
        <Icon name="Cookie" fallback="Info" size={28} className="shrink-0 hidden sm:block opacity-90" />
        <p className="text-sm text-center sm:text-left flex-1">
          Мы используем файлы cookie для улучшения работы сайта. Продолжая пользоваться сайтом, вы соглашаетесь с их использованием в соответствии с{' '}
          <a
            href={PRIVACY_POLICY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-100 opacity-90"
          >
            политикой конфиденциальности
          </a>.
        </p>
        <Button
          onClick={accept}
          className="bg-secondary hover:bg-secondary/90 shrink-0 w-full sm:w-auto"
        >
          Принять
        </Button>
      </div>
    </div>
  );
};

export default CookieConsent;