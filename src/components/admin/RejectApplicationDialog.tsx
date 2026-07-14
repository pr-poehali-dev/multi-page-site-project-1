import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RejectApplicationDialogProps {
  open: boolean;
  status: 'rejected' | 'pending' | null;
  onClose: () => void;
  onConfirm: (comment: string) => void;
}

const RejectApplicationDialog = ({ open, status, onClose, onConfirm }: RejectApplicationDialogProps) => {
  const [comment, setComment] = useState('');

  const title = status === 'pending' ? 'Вернуть заявку на доработку' : 'Отклонить заявку';
  const actionLabel = status === 'pending' ? 'Вернуть на доработку' : 'Отклонить';

  const handleConfirm = () => {
    onConfirm(comment);
    setComment('');
  };

  const handleClose = () => {
    setComment('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Комментарий будет отправлен участнику на email и показан в личном кабинете
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="admin-comment">Причина (необязательно)</Label>
          <Textarea
            id="admin-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Например: пришлите фонограмму в лучшем качестве"
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectApplicationDialog;
