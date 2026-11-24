// Drag and drop that works with a finger, a mouse or a pen (pointer events), plus tap-then-tap as a fallback:
// tap an item to pick it up, then tap where it should go. Window listeners are attached at once on
// pointerdown, so even a very quick tap is never missed.
import { useCallback, useEffect, useRef, useState } from 'react';

export interface DragState { id: string; dx: number; dy: number; moved: boolean }

export function useDragDrop(onDrop: (id: string, zone: string) => void, enabled = true) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const dropRef = useRef(onDrop);
  dropRef.current = onDrop;
  const cleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanup.current?.(), []);

  const begin = useCallback((id: string, x0: number, y0: number) => {
    cleanup.current?.();
    let moved = false;
    const move = (e: PointerEvent) => {
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (Math.hypot(dx, dy) > 6) moved = true;
      setDrag({ id, dx, dy, moved });
    };
    const up = (e: PointerEvent) => {
      stop();
      setDrag(null);
      if (!moved) { setSelected((cur) => (cur === id ? null : id)); return; }
      setSelected(null);
      const zone = (document.elementsFromPoint?.(e.clientX, e.clientY) ?? [])
        .map((el) => (el as HTMLElement).closest?.('[data-zone]') as HTMLElement | null).find(Boolean);
      if (zone?.dataset.zone) dropRef.current(id, zone.dataset.zone);
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      cleanup.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    cleanup.current = stop;
    setDrag({ id, dx: 0, dy: 0, moved: false });
  }, []);

  const itemProps = useCallback((id: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (!enabled) return;
      e.preventDefault();
      begin(id, e.clientX, e.clientY);
    },
    style: drag?.id === id && drag.moved
      ? { transform: `translate(${drag.dx}px, ${drag.dy}px) scale(1.08)`, zIndex: 50, pointerEvents: 'none' as const, transition: 'none' }
      : undefined,
    'data-selected': selected === id ? 'true' : undefined,
  }), [drag, selected, enabled, begin]);

  const zoneProps = useCallback((zone: string) => ({
    'data-zone': zone,
    onClick: () => { if (selected && enabled) { const id = selected; setSelected(null); dropRef.current(id, zone); } },
    'data-ready': selected ? 'true' : undefined,
  }), [selected, enabled]);

  return { itemProps, zoneProps, selected, dragging: drag?.id ?? null };
}
