import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import './MapDisplay.css';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
const ZOOM_SENSITIVITY = 0.001;

// Wrap component in forwardRef to receive a ref from the parent
const MapDisplay = forwardRef(({ children }, ref) => {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // This function is now ONLY called by the manual "Center View" button
  const centerView = (newZoom = 1) => {
    if (!containerRef.current || !contentRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    // Use offsetWidth/Height for a more stable measurement, unaffected by the current transform
    const contentWidth = contentRef.current.offsetWidth;
    const contentHeight = contentRef.current.offsetHeight;

    // Calculate the pan needed to center the content
    const newPanX = (containerRect.width - contentWidth * newZoom) / 2;
    const newPanY = (containerRect.height - contentHeight * newZoom) / 2;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Expose the centerView function to the parent component
  useImperativeHandle(ref, () => ({
    centerView,
  }));

  // THIS IS THE KEY FIX: The useEffect that automatically centered the view has been REMOVED.
  // The view will now default to pan={0,0} and zoom={1} when content changes.

  const handleWheel = (e) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;

    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom - e.deltaY * ZOOM_SENSITIVITY * zoom));

    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleMouseDown = (e) => {
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      containerRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseUp = (e) => {
    if (e.button === 1) {
      isPanningRef.current = false;
      containerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e) => {
    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan(prevPan => ({ x: prevPan.x + dx, y: prevPan.y + dy }));
      panStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseLeave = (e) => {
      isPanningRef.current = false;
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grab';
      }
  }

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  return (
    <div
      className="map-display-viewport"
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      <div
        className="map-display-content"
        ref={contentRef}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {children}
      </div>
    </div>
  );
});

export default MapDisplay;
