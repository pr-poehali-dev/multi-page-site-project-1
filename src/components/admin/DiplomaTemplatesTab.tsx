import { useState } from 'react';
import DiplomaTemplatesList from './diploma/DiplomaTemplatesList';
import DiplomaTemplateEditor from './diploma/DiplomaTemplateEditor';

const DiplomaTemplatesTab = () => {
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);

  if (editingTemplateId !== null) {
    return <DiplomaTemplateEditor templateId={editingTemplateId} onBack={() => setEditingTemplateId(null)} />;
  }

  return <DiplomaTemplatesList onOpenEditor={setEditingTemplateId} />;
};

export default DiplomaTemplatesTab;
