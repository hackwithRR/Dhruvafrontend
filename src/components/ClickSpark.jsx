import { useRef, useEffect, useCallback } from 'react';

const ClickSpark = ({
  sparkColor = '#fff',
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = 'ease-out',
  extraScale = 1.0,
  children,
  global = false
}) => {
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);
  const instanceId = useRef(`spark-${Math.random().toString(36).substr(2, 9)}`);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = global ? window.innerWidth : canvas.parentElement.getBoundingClientRect().width;
      canvas.height = global ? window.innerHeight : canvas.parentElement.getBoundingClientRect().height;
    };

    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);
    resizeCanvas();

    return () => window.removeEventListener('resize', handleResize);
  }, [global]);

  const easeFunc = useCallback(
    t => {
      switch (easing) {
        case 'linear':
          return t;
        case 'ease-in':
          return t * t;
        case 'ease-in-out':
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default:
          return t * (2 - t);
      }
    },
    [easing]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationId;

    const draw = timestamp => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparksRef.current = sparksRef.current.filter(spark => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) {
          return false;
        }

        const progress = elapsed / duration;
        const eased = easeFunc(progress);

        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        return true;
      });

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [sparkColor, sparkSize, sparkRadius, sparkCount, duration, easeFunc, extraScale]);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const now = performance.now();
      const newSparks = Array.from({ length: sparkCount }, (_, i) => ({
        x, y, angle: (Math.PI * 2 * i) / sparkCount, startTime: now
      }));
      sparksRef.current.push(...newSparks);
    };

    if (global) {
      document.addEventListener('click', handleGlobalClick, true);
    } else {
      const wrapper = canvasRef.current?.parentElement;
      if (wrapper) wrapper.addEventListener('click', handleGlobalClick);
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
      const wrapper = canvasRef.current?.parentElement;
      if (wrapper) wrapper.removeEventListener('click', handleGlobalClick);
    };
  }, [global, sparkCount]);

  return (
    <div className="relative w-full h-full">
      <canvas 
        ref={canvasRef} 
        className={`block absolute select-none pointer-events-none z-[9999] ${global ? 'fixed inset-0 w-screen h-screen' : 'w-full h-full top-0 left-0'}`} 
      />
      {children}
    </div>
  );
};

export default ClickSpark;

