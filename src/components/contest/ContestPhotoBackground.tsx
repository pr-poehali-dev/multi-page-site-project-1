interface PhotoItem {
  img: string;
  side: string;
  title?: string;
}

interface ContestPhotoBackgroundProps {
  photos: PhotoItem[];
}

const ContestPhotoBackground = ({ photos }: ContestPhotoBackgroundProps) => {
  return (
    <div
      className="orbit-container"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {photos.map((item, i) => {
        const isLeft = item.side === 'left';
        const startX = isLeft ? -750 : 750;
        const midX = isLeft ? -730 : 730;
        const endX = isLeft ? -770 : 770;
        const rotateStart = isLeft ? -15 : 15;
        const rotateMid = isLeft ? -5 : 5;
        const rotateEnd = isLeft ? -20 : 20;
        return (
          <div
            key={i}
            className="orbit-item"
            style={{
              '--orbit-delay': `${i * 1.2}s`,
              '--orbit-duration': '8s',
              '--start-x': `${startX}px`,
              '--mid-x': `${midX}px`,
              '--end-x': `${endX}px`,
              '--rotate-start': `${rotateStart}deg`,
              '--rotate-mid': `${rotateMid}deg`,
              '--rotate-end': `${rotateEnd}deg`,
            } as React.CSSProperties}
          >
            <img src={item.img} alt={item.title || `Фото ${i + 1}`} className="orbit-photo" />
          </div>
        );
      })}
    </div>
  );
};

export default ContestPhotoBackground;
