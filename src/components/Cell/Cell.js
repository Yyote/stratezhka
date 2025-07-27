import React, { useState } from 'react';
import './Cell.css';

const Cell = ({ texture, editorMode, onClick }) => {
  const [isHovering, setIsHovering] = useState(false);

  // In editor mode, we just call the passed onClick function (for painting)
  // In play mode, we could add different logic (e.g. selecting a unit)
  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) {
      onClick(); // The parent (Editor or Game) decides what this does
    }
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  // The hover tint should only apply in "play" mode, not while editing.
  const overlayColor = isHovering && !editorMode ? 'rgba(255, 255, 255, 0.5)' : 'transparent';

  const cellStyle = {
    backgroundImage: `url(${texture})`,
    zIndex: isHovering ? 10 : 1,
  };

  const overlayStyle = {
    backgroundColor: overlayColor,
  };

  return (
    <div
      className="cell"
      style={cellStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      // We use onMouseDown for painting to allow for a "click and drag" feel
      onMouseDown={handleClick}
      onContextMenu={(e) => e.preventDefault()} // Prevent context menu in both modes
    >
      <div className="cell-overlay" style={overlayStyle}></div>
    </div>
  );
};

export default Cell;
