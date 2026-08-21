import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { trackGoal } from '@/lib/analytics';
import type { ContestOption } from './NewApplicationStep1';

const APPLICATIONS_URL = 'https://functions.poehali.dev/065d2b6a-5112-4a26-a642-211398843a75';
const UPLOAD_URL = 'https://functions.poehali.dev/cfc99bc2-daff-4110-b9e4-c9699841a7d3';

interface Participant {
  full_name: string;
  email: string;
  phone: string;
  city: string;
}

const buildContestFolderName = (title: string, location?: string, eventDate?: string) => {
  const parts = [title, location, eventDate].filter(Boolean);
  return parts.join(', ');
};

interface UseNewApplicationSubmitParams {
  participant: Participant;
  contests: ContestOption[];
  contestId: string;
  nominationId: number | null;
  customValues: Record<string, string>;
  customFileValues: Record<string, File>;
  customAudioFileValues: Record<string, File>;
  onSuccess: () => void;
}

export const useNewApplicationSubmit = ({
  participant,
  contests,
  contestId,
  nominationId,
  customValues,
  customFileValues,
  customAudioFileValues,
  onSuccess,
}: UseNewApplicationSubmitParams) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const selectedContest = contests.find(c => String(c.id) === contestId);
      const contestTitle = buildContestFolderName(selectedContest?.title || '', selectedContest?.location, selectedContest?.event_date);

      // Загружаем файлы из кастомных полей и получаем их URL перед отправкой заявки
      let finalCustomValues = customValues;
      const fileEntries = Object.entries(customFileValues);
      if (fileEntries.length > 0) {
        const uploadedUrls: Record<string, string> = {};
        for (const [fieldName, file] of fileEntries) {
          const fileData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const uploadRes = await fetch(UPLOAD_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              files: [{ fileName: file.name, fileType: file.type, fileSize: file.size, fileData }],
            }),
          });
          const uploadData = await uploadRes.json();
          if (uploadData.files?.[0]?.fileUrl) {
            uploadedUrls[fieldName] = uploadData.files[0].fileUrl;
          }
        }
        finalCustomValues = { ...finalCustomValues, ...uploadedUrls };
      }

      // Загружаем фонограммы напрямую на Яндекс.Диск (минуя наш сервер, без ограничения по размеру)
      const audioEntries = Object.entries(customAudioFileValues);
      if (audioEntries.length > 0) {
        const uploadedAudioUrls: Record<string, string> = {};
        for (const [fieldName, file] of audioEntries) {
          try {
            const urlRes = await fetch(UPLOAD_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ target: 'yandex', contestTitle, fileName: file.name }),
            });
            const urlData = await urlRes.json();
            if (!urlData.uploadUrl) {
              throw new Error(urlData.error || 'Не удалось получить ссылку для загрузки');
            }

            const putRes = await fetch(urlData.uploadUrl, { method: 'PUT', body: file });
            if (!putRes.ok) {
              throw new Error('Не удалось загрузить файл на Яндекс.Диск');
            }

            const finalizeRes = await fetch(UPLOAD_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ target: 'yandex', step: 'finalize', path: urlData.path }),
            });
            const finalizeData = await finalizeRes.json();
            if (finalizeData.fileUrl) {
              uploadedAudioUrls[fieldName] = finalizeData.fileUrl;
            } else {
              throw new Error(finalizeData.error || 'Не удалось опубликовать файл');
            }
          } catch (err) {
            toast({ title: 'Ошибка загрузки фонограммы', description: err instanceof Error ? err.message : file.name, variant: 'destructive' });
          }
        }
        finalCustomValues = { ...finalCustomValues, ...uploadedAudioUrls };
      }

      const res = await fetch(APPLICATIONS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: participant.full_name,
          email: participant.email,
          phone: participant.phone,
          city: participant.city,
          password: '',
          contestId,
          nominationId,
          customFields: finalCustomValues,
        }),
      });
      const result = await res.json();

      if (result.success) {
        // Обновляем данные в localStorage
        const stored = localStorage.getItem('participantData');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.applications = [
            {
              id: result.applicationId,
              contest_title: contests.find(c => String(c.id) === contestId)?.title || '',
              category: '',
              performance_title: '',
              participation_format: '',
              nomination: '',
              status: 'pending',
              submitted_at: new Date().toISOString(),
              start_date: '',
              end_date: '',
              contest_status: 'active',
            },
            ...parsed.applications,
          ];
          localStorage.setItem('participantData', JSON.stringify(parsed));
        }

        toast({ title: 'Заявка отправлена!', description: 'Мы рассмотрим её в течение 3 дней.' });
        trackGoal('application_submit');
        onSuccess();
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось отправить заявку', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка соединения', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return { submitting, handleSubmit };
};
