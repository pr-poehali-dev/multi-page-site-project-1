import Icon from '@/components/ui/icon';

interface MaintenanceBannerProps {
  message: string;
}

const MaintenanceBanner = ({ message }: MaintenanceBannerProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl mb-6 border border-amber-300/60 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 shadow-sm">
      <div className="absolute -top-6 -right-6 w-28 h-28 bg-amber-300/20 rounded-full blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-orange-300/20 rounded-full blur-2xl" />
      <div className="relative flex items-start gap-4 p-5">
        <div className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-amber-400/90 text-amber-950 shadow-md">
          <Icon name="Construction" size={22} />
        </div>
        <div className="min-w-0">
          <h3 className="font-heading font-bold text-amber-900 mb-1 flex items-center gap-2">
            Технические работы
          </h3>
          <p className="text-sm text-amber-900/90 whitespace-pre-wrap leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceBanner;
