import React, { useState } from 'react';
import './Cell.css';

const Cell = ({ id, texture, unitTexture, tint, onClick, editorMode }) => {
  const [isHovering, setIsHovering] = useState(false);

  // The overlay color logic is now simplified and also accounts for editor mode.
  const getOverlayColor = () => {
    if (tint) {
      return tint === 'blue' ? 'rgba(100, 149, 237, 0.5)' : 'rgba(255, 99, 71, 0.5)';
    }
    // Only show hover tint in game mode, not editor mode.
    if (isHovering && !editorMode) {
      return 'rgba(255, 255, 255, 0.3)';
    }
    return 'transparent';
  };

  const cellStyle = {
    backgroundImage: `url(${texture})`,
    zIndex: isHovering ? 10 : 1,
  };

  const overlayStyle = {
    backgroundColor: getOverlayColor(),
  };

  return (
    <div
      id={id}
      className="cell"
      style={cellStyle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      // ==========================================================
      // THE FIX: Always use the standard onClick event.
      // The parent component (Game or MapEditor) decides what this click does.
      // ==========================================================
      onClick={onClick}
      // Prevent the default right-click menu from appearing.
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Render unit on top of the cell texture */}
      {unitTexture && <img src={unitTexture} className="unit-sprite" alt="unit" />}
      <div className="cell-overlay" style={overlayStyle}></div>
    </div>
  );
};

export default Cell;
