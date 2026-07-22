import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatMultilineText } from '@/lib/formatMultilineText';

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
}

interface NewsDetailModalProps {
  news: NewsItem | null;
  onClose: () => void;
}

const NewsDetailModal = ({ news, onClose }: NewsDetailModalProps) => {
  return (
    <Dialog open={news !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {news && (
          <>
            {news.image_url && (
              <img
                src={news.image_url}
                alt={news.title}
                className="w-full max-h-80 object-cover rounded-lg -mt-2 mb-2"
              />
            )}
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading">{news.title}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(news.created_at).toLocaleDateString('ru-RU', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </DialogHeader>
            <div className="text-base leading-relaxed text-foreground/90">
              {formatMultilineText(news.content)}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewsDetailModal;
