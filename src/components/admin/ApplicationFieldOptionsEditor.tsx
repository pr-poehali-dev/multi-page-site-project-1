import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ApplicationFieldOptionsEditorProps {
  options: string;
  onChange: (options: string) => void;
}

const parseOptions = (options: string): string[] =>
  options.split(',').map(o => o.trim()).filter(Boolean);

const ApplicationFieldOptionsEditor = ({ options, onChange }: ApplicationFieldOptionsEditorProps) => {
  const [newOption, setNewOption] = useState('');
  const list = parseOptions(options);

  const addOption = () => {
    const value = newOption.trim();
    if (!value || list.includes(value)) { setNewOption(''); return; }
    onChange([...list, value].join(', '));
    setNewOption('');
  };

  const removeOption = (idx: number) => {
    onChange(list.filter((_, i) => i !== idx).join(', '));
  };

  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">Варианты выбора</label>
      {list.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {list.map((o, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 bg-muted rounded-full pl-2.5 pr-1 py-1 text-xs">
              {o}
              <button type="button" onClick={() => removeOption(idx)} className="text-muted-foreground hover:text-destructive rounded-full p-0.5">
                <Icon name="X" size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={newOption}
          onChange={e => setNewOption(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
          placeholder="Новый вариант..."
          className="h-8 text-sm"
        />
        <Button type="button" size="sm" variant="outline" onClick={addOption} disabled={!newOption.trim()} className="h-8 shrink-0">
          <Icon name="Plus" size={14} />
        </Button>
      </div>
    </div>
  );
};

export default ApplicationFieldOptionsEditor;
