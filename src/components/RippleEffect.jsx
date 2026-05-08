import { useRef, useEffect, useCallback } from 'react';

const RippleEffect = ({
  color = '#ffffff',
  intensity = 1,
  speed = 1,
  ringCount = 3,
  children,
  className = ''
}) => {
  const canvasRef = useRef(null);
  const ripplesRef = useRef([]);
  const rectRef = useRef(null);
  const animationIdRef = useRef(null);

  // Mouse position tracking
  const handleClick = useCallback((e) => {
    const rect = rectRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height);

    const now = performance.now();
    ripplesRef.current.push({
      x: x - size / 2,
      y: y - size / 2,
      radius: 0,
      maxRadius: size * intensity,
      startTime: now,
      color: color.replace('#', 'rgba(') + `, ${0.4 / ringCount})`
    });
  }, [intensity, ringCount, color]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let lastTime = 0;

    const animate = (time) => {
      if (time - lastTime < 16) { // ~60fps
        animationIdRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ripplesRef.current = ripplesRef.current.filter(ripple => {
        const elapsed = time - ripple.startTime;
        const progress = Math.min(elapsed / (3000 / speed), 1);
        ripple.radius = ripple.maxRadius * progress;

        if (progress >= 1) return false;

        // Water-like ripple: multiple transparent rings
        for (let i = 0; i < ringCount; i++) {
          const ringProgress = (progress + i / ringCount) % 1;
          const ringOpacity = (1 - ringProgress) * 0.8;
          const ringRadius = ripple.radius * (0.8 + i * 0.15);

          ctx.beginPath();
          ctx.arc(ripple.x + canvas.width / 2, ripple.y + canvas.height / 2, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = ripple.color.replace(/[\d.]+$/, `, ${ringOpacity})`);
          ctx.lineWidth = 2 * intensity;
          ctx.stroke();
        }

        return true;
      });

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [speed, ringCount, intensity, color]);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const rect = rectRef.current?.getBoundingClientRect();
      if (!canvas || !rect) return;

      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    window.addEventListener('resize', resize);
    resize();

    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div 
      ref={rectRef}
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
      style={{ cursor: 'inherit' }}
    >
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
        style={{ display: 'block' }}
      />
      {children}
    </div>
  );
};

export default RippleEffect;

