
import React from 'react';
import { Icons } from './Icon';
import { Petal } from '../hooks/useSakuraAnimation';

interface SakuraOverlayProps {
  petals: Petal[];
}

export const SakuraOverlay: React.FC<SakuraOverlayProps> = ({ petals }) => {
  return (
    <>
      {petals.map(petal => (
        <div
          key={petal.id}
          className={`fixed z-50 pointer-events-none animate-sakura-fall ${petal.depthBlur}`}
          style={{
            left: petal.left,
            width: petal.size,
            height: petal.size,
            animationDuration: petal.duration,
            animationDelay: petal.delay,
            '--sway-x': petal.swayX, 
          } as React.CSSProperties}
        >
          {petal.type === 'petal' ? (
              <div className={petal.color}>
                <Icons.SakuraPetal />
              </div>
          ) : (
              <div className={`w-full h-full rounded-full opacity-60 ${petal.color}`}></div>
          )}
        </div>
      ))}
    </>
  );
};
