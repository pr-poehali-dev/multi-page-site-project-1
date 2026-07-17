import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DiplomaTemplate, DiplomaTemplateField, DiplomaFont } from '@/types/diploma';

const API = 'https://functions.poehali.dev/9fcbf70c-fd6d-4489-bc77-1e4bcd6f1cb1';

export const useDiplomaTemplates = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<DiplomaTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [fonts, setFonts] = useState<DiplomaFont[]>([]);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}?action=templates`);
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить шаблоны', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadFonts = useCallback(async () => {
    try {
      const res = await fetch(`${API}?action=fonts`);
      const data = await res.json();
      setFonts(data.fonts || []);
    } catch { setFonts([]); }
  }, []);

  useEffect(() => { loadTemplates(); loadFonts(); }, [loadTemplates, loadFonts]);

  const createTemplate = useCallback(async (name: string, templateType: string, orientation: string): Promise<DiplomaTemplate | null> => {
    try {
      const res = await fetch(`${API}?action=template_create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, template_type: templateType, orientation }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTemplates(prev => [data.template, ...prev]);
      toast({ title: 'Шаблон создан' });
      return data.template;
    } catch {
      toast({ title: 'Ошибка создания шаблона', variant: 'destructive' });
      return null;
    }
  }, [toast]);

  const deleteTemplate = useCallback(async (id: number) => {
    if (!confirm('Удалить шаблон? Это действие необратимо.')) return;
    try {
      await fetch(`${API}?action=template_delete&id=${id}`, { method: 'DELETE' });
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({ title: 'Шаблон удалён' });
    } catch {
      toast({ title: 'Ошибка удаления', variant: 'destructive' });
    }
  }, [toast]);

  const loadTemplate = useCallback(async (id: number): Promise<{ template: DiplomaTemplate; fields: DiplomaTemplateField[] } | null> => {
    try {
      const res = await fetch(`${API}?action=template&id=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return { template: data.template, fields: data.fields || [] };
    } catch {
      toast({ title: 'Ошибка загрузки шаблона', variant: 'destructive' });
      return null;
    }
  }, [toast]);

  const updateTemplate = useCallback(async (id: number, updates: Partial<DiplomaTemplate>) => {
    try {
      const res = await fetch(`${API}?action=template_update&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    } catch {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' });
    }
  }, [toast]);

  const uploadBackground = useCallback(async (id: number, file: File): Promise<string | null> => {
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = e => resolve((e.target!.result as string).split(',')[1]);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const res = await fetch(`${API}?action=upload_background&id=${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_base64: b64, file_name: file.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'Подложка загружена' });
      return data.background_url;
    } catch {
      toast({ title: 'Ошибка загрузки подложки', variant: 'destructive' });
      return null;
    }
  }, [toast]);

  const deleteBackground = useCallback(async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API}?action=delete_background&id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ title: 'Подложка удалена' });
      return true;
    } catch {
      toast({ title: 'Ошибка удаления подложки', variant: 'destructive' });
      return false;
    }
  }, [toast]);

  const saveFields = useCallback(async (templateId: number, fields: DiplomaTemplateField[]): Promise<DiplomaTemplateField[] | null> => {
    try {
      const res = await fetch(`${API}?action=save_fields&template_id=${templateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'Шаблон сохранён' });
      return data.fields;
    } catch {
      toast({ title: 'Ошибка сохранения полей', variant: 'destructive' });
      return null;
    }
  }, [toast]);

  const uploadFont = useCallback(async (name: string, file: File): Promise<DiplomaFont | null> => {
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = e => resolve((e.target!.result as string).split(',')[1]);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const res = await fetch(`${API}?action=upload_font`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, file_base64: b64, file_name: file.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFonts(prev => [...prev, data.font]);
      toast({ title: 'Шрифт загружен' });
      return data.font;
    } catch {
      toast({ title: 'Ошибка загрузки шрифта', variant: 'destructive' });
      return null;
    }
  }, [toast]);

  const deleteFont = useCallback(async (id: number) => {
    try {
      await fetch(`${API}?action=delete_font&id=${id}`, { method: 'DELETE' });
      setFonts(prev => prev.filter(f => f.id !== id));
      toast({ title: 'Шрифт удалён' });
    } catch {
      toast({ title: 'Ошибка удаления шрифта', variant: 'destructive' });
    }
  }, [toast]);

  return {
    templates, loading, fonts,
    loadTemplates, createTemplate, deleteTemplate, loadTemplate, updateTemplate,
    uploadBackground, deleteBackground, saveFields, uploadFont, deleteFont,
  };
};