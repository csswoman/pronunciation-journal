import { useCallback, useRef } from "react";

const MIN_WIDTH = 320;
const MAX_WIDTH = 760;

interface UsePanelResizeParams {
  panelWidth: number;
  setPanelWidth: (width: number) => void;
}

export function usePanelResize({ panelWidth, setPanelWidth }: UsePanelResizeParams) {
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  const onMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = dragStartX.current - event.clientX;
    const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta));
    setPanelWidth(next);
  }, [setPanelWidth]);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  const onDragStart = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    isDragging.current = true;
    dragStartX.current = event.clientX;
    dragStartWidth.current = panelWidth;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [panelWidth, onMouseMove, onMouseUp]);

  return { isDragging, onDragStart };
}
