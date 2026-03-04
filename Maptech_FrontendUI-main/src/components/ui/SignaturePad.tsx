import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eraser, Check, Save } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  initialValue?: string;
  /** Fixed height in CSS pixels (default 200). Width auto-fills the container. */
  height?: number;
  disabled?: boolean;
}

export function SignaturePad({ onSave, initialValue, height = 200, disabled = false }: SignaturePadProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(!!initialValue);
  const [isSaved, setIsSaved] = useState(!!initialValue);
  const [canvasWidth, setCanvasWidth] = useState(0);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  // Observe wrapper width so canvas always fills its container
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        if (w > 0) setCanvasWidth(w);
      }
    });
    observer.observe(wrapper);

    // Initial measurement
    const w = Math.floor(wrapper.getBoundingClientRect().width);
    if (w > 0) setCanvasWidth(w);

    return () => observer.disconnect();
  }, []);

  // Setup / resize canvas whenever measured width or height changes
  useEffect(() => {
    if (canvasWidth === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, height);

    // Drawing settings
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load initial value
    if (initialValue) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvasWidth, height);
      };
      img.src = initialValue;
    }
  }, [canvasWidth, height, initialValue, getCtx]);

  const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasContent(true);
    if (isSaved) setIsSaved(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas && hasContent) {
      onSave(canvas.toDataURL('image/png'));
      setIsSaved(true);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasContent(false);
    setIsSaved(false);
    onSave('');
  };

  return (
    <div className="space-y-2">
      <div
        ref={wrapperRef}
        className={`relative border-2 rounded-lg overflow-hidden w-full ${disabled ? 'opacity-60 pointer-events-none' : 'border-gray-200 dark:border-gray-600'} ${hasContent ? 'border-[#3BC25B]' : ''}`}
      >
        <canvas
          ref={canvasRef}
          className="cursor-crosshair touch-none bg-white block w-full"
          style={{ height: `${height}px` }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasContent && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-300 dark:text-gray-500 text-sm">Sign here</span>
          </div>
        )}
      </div>
      {!disabled && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1 px-3 py-1 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Eraser className="w-3 h-3" /> Clear
          </button>
          <div className="flex items-center gap-2">
            {hasContent && !isSaved && (
              <button
                type="button"
                onClick={saveSignature}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#0E8F79] hover:bg-[#0b7a67] rounded-lg transition-colors"
              >
                <Save className="w-3 h-3" /> Save Signature
              </button>
            )}
            {isSaved && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Check className="w-3 h-3" /> Signature saved
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
