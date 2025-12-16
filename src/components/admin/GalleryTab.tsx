import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GalleryItem {
  id: number;
  title: string;
  description: string;
  file_url: string;
  thumbnail_url?: string;
  media_type: 'photo' | 'video';
  contest_id?: number;
  display_order: number;
  is_featured: boolean;
  created_at: string;
}

interface GalleryTabProps {
  items: GalleryItem[];
  loading: boolean;
  onUploadClick: () => void;
  onEditClick: (item: GalleryItem) => void;
  onDeleteClick: (id: number) => void;
}

export default function GalleryTab({
  items,
  loading,
  onUploadClick,
  onEditClick,
  onDeleteClick
}: GalleryTabProps) {
  const [filterType, setFilterType] = useState<'all' | 'photo' | 'video'>('all');
  const [filterFeatured, setFilterFeatured] = useState(false);

  const filteredItems = items.filter(item => {
    if (filterType !== 'all' && item.media_type !== filterType) return false;
    if (filterFeatured && !item.is_featured) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterType('all')}
            size="sm"
          >
            Все
          </Button>
          <Button
            variant={filterType === 'photo' ? 'default' : 'outline'}
            onClick={() => setFilterType('photo')}
            size="sm"
          >
            Фото
          </Button>
          <Button
            variant={filterType === 'video' ? 'default' : 'outline'}
            onClick={() => setFilterType('video')}
            size="sm"
          >
            Видео
          </Button>
          <Button
            variant={filterFeatured ? 'default' : 'outline'}
            onClick={() => setFilterFeatured(!filterFeatured)}
            size="sm"
          >
            <Icon name="Star" size={16} className="mr-1" />
            Избранные
          </Button>
        </div>
        
        <Button onClick={onUploadClick} className="gap-2">
          <Icon name="Upload" size={18} />
          Загрузить файл
        </Button>
      </div>

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Icon name="Image" size={48} className="mx-auto mb-4 opacity-20" />
              <p>Файлов пока нет</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {item.media_type === 'photo' ? (
                  <img 
                    src={item.file_url} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video 
                    src={item.file_url} 
                    className="w-full h-full object-cover"
                    controls
                  />
                )}
                {item.is_featured && (
                  <Badge className="absolute top-2 right-2 bg-yellow-500">
                    <Icon name="Star" size={14} />
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {item.media_type === 'photo' ? 'Фото' : 'Видео'}
                  </Badge>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditClick(item)}
                    className="flex-1"
                  >
                    <Icon name="Edit" size={14} className="mr-1" />
                    Изменить
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteClick(item.id)}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Icon name="Trash2" size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
