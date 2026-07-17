import { useRef, ReactNode } from 'react';
import { RULER_SIZE_PX } from '@/types/diploma';

interface DiplomaRulersProps {
  pageWidthPx: number;
  pageHeightPx: number;
  onAddGuide: (orientation: 'h' | 'v', posPercent: number) => void;
  children: ReactNode;
}

const STEP_MM = 10;
const MM_TO_PX = 3.7795275591;

const DiplomaRulers = ({ pageWidthPx, pageHeightPx, onAddGuide, children }: DiplomaRulersProps) => {
  const pageRef = useRef<HTMLDivElement>(null);

  const hTicks: number[] = [];
  for (let mm = 0; mm * MM_TO_PX <= pageWidthPx; mm += STEP_MM) hTicks.push(mm);
  const vTicks: number[] = [];
  for (let mm = 0; mm * MM_TO_PX <= pageHeightPx; mm += STEP_MM) vTicks.push(mm);

  const handleHRulerMouseDown = (e: React.MouseEvent) => {
    const page = pageRef.current;
    if (!page) return;
    const rect = page.getBoundingClientRect();
    const posPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    onAddGuide('v', posPercent);
  };

  const handleVRulerMouseDown = (e: React.MouseEvent) => {
    const page = pageRef.current;
    if (!page) return;
    const rect = page.getBoundingClientRect();
    const posPercent = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    onAddGuide('h', posPercent);
  };

  return (
    <div className="inline-block" style={{ paddingLeft: RULER_SIZE_PX, paddingTop: RULER_SIZE_PX }}>
      <div className="relative">
        {/* Верхняя линейка */}
        <div
          className="absolute bg-muted border-b border-border cursor-crosshair select-none"
          style={{ left: 0, top: -RULER_SIZE_PX, width: pageWidthPx, height: RULER_SIZE_PX }}
          onMouseDown={handleHRulerMouseDown}
          title="Потяните вниз, чтобы добавить вертикальную направляющую"
        >
          {hTicks.map(mm => (
            <div key={mm} className="absolute bottom-0 text-[9px] text-muted-foreground" style={{ left: mm * MM_TO_PX }}>
              <div className="border-l border-muted-foreground/50" style={{ height: mm % (STEP_MM * 5) === 0 ? 10 : 6 }} />
              {mm % (STEP_MM * 5) === 0 && <span className="absolute -top-3 left-0.5">{mm}</span>}
            </div>
          ))}
        </div>

        {/* Левая линейка */}
        <div
          className="absolute bg-muted border-r border-border cursor-crosshair select-none"
          style={{ left: -RULER_SIZE_PX, top: 0, width: RULER_SIZE_PX, height: pageHeightPx }}
          onMouseDown={handleVRulerMouseDown}
          title="Потяните вправо, чтобы добавить горизонтальную направляющую"
        >
          {vTicks.map(mm => (
            <div key={mm} className="absolute right-0 text-[9px] text-muted-foreground" style={{ top: mm * MM_TO_PX }}>
              <div className="border-t border-muted-foreground/50" style={{ width: mm % (STEP_MM * 5) === 0 ? 10 : 6 }} />
              {mm % (STEP_MM * 5) === 0 && (
                <span className="absolute -left-0.5 top-0.5 [writing-mode:vertical-rl]">{mm}</span>
              )}
            </div>
          ))}
        </div>

        {/* Угол */}
        <div
          className="absolute bg-muted border-r border-b border-border"
          style={{ left: -RULER_SIZE_PX, top: -RULER_SIZE_PX, width: RULER_SIZE_PX, height: RULER_SIZE_PX }}
        />

        <div ref={pageRef}>{children}</div>
      </div>
    </div>
  );
};

export default DiplomaRulers;
