import React, { useEffect, useRef } from 'react';
import { drawBody, idlePose } from '@/game/bodies';

export default function Portrait({ id, size = 120, facing = 1, stance = 'flash', className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, ctx = c.getContext('2d'), dpr = window.devicePixelRatio || 1;
    c.width = size * dpr; c.height = size * dpr;
    let raf, t = Math.floor(Math.random() * 100);
    const draw = () => {
      t++;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size, size);
      const s = (size / 100) * 1.15, p = idlePose(t, { stance });
      ctx.translate(size / 2, size * 0.88 - p.bob); ctx.scale(s * facing, s * p.sy);
      drawBody(ctx, id, p);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [id, size, facing, stance]);
  return <canvas ref={ref} style={{ width: size, height: size }} className={className} />;
}