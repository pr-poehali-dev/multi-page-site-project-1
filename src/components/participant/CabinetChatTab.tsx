import { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export interface ChatMessage {
  id: number;
  sender: 'admin' | 'user';
  message: string;
  created_at: string;
}

interface CabinetChatTabProps {
  messages: ChatMessage[];
  messagesLoading: boolean;
  msgText: string;
  setMsgText: (text: string) => void;
  sendingMsg: boolean;
  sendMessage: () => void;
  messagesEndRef: RefObject<HTMLDivElement>;
}

const CabinetChatTab = ({ messages, messagesLoading, msgText, setMsgText, sendingMsg, sendMessage, messagesEndRef }: CabinetChatTabProps) => {
  return (
    <Card className="flex flex-col h-[70vh]">
      <CardHeader className="border-b shrink-0">
        <CardTitle className="flex items-center gap-2.5 text-xl">
          <Icon name="MessageSquare" size={24} /> Чат с организаторами
        </CardTitle>
      </CardHeader>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messagesLoading ? (
          <div className="text-center py-8">
            <Icon name="Loader2" size={28} className="mx-auto animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="MessageSquare" size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg">Нет сообщений. Напишите нам, если есть вопросы!</p>
          </div>
        ) : messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-base ${
              m.sender === 'user'
                ? 'bg-secondary text-secondary-foreground rounded-br-sm'
                : 'bg-muted rounded-bl-sm'
            }`}>
              <p>{m.message}</p>
              <p className={`text-xs mt-1.5 ${m.sender === 'user' ? 'text-secondary-foreground/70' : 'text-muted-foreground'}`}>
                {new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                {' · '}
                {new Date(m.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-3 p-5 border-t shrink-0">
        <Input
          value={msgText}
          onChange={(e) => setMsgText(e.target.value)}
          placeholder="Написать сообщение..."
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          disabled={sendingMsg}
          className="h-11 text-base"
        />
        <Button size="lg" onClick={sendMessage} disabled={sendingMsg || !msgText.trim()} className="bg-secondary hover:bg-secondary/90">
          {sendingMsg ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="Send" size={18} />}
        </Button>
      </div>
    </Card>
  );
};

export default CabinetChatTab;