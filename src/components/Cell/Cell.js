import React, { useState } from 'react';
import './Cell.css';

const Cell = ({ id, texture, unitTexture, tint, onClick }) => {
  const [isHovering, setIsHovering] = useState(false);

  // The overlay color is now determined by the tint prop passed from Game.js
  const overlayColor = tint
    ? (tint === 'blue' ? 'rgba(100, 149, 237, 0.5)' : 'rgba(255, 99, 71, 0.5)')
    : (isHovering ? 'rgba(255, 255, 255, 0.3)' : 'transparent');

  const cellStyle = {
    backgroundImage: `url(${texture})`,
    zIndex: isHovering ? 10 : 1,
  };

  const overlayStyle = {
    backgroundColor: overlayColor,
  };

  return (
    <div
      id={id} // Set the ID for the arrow to attach to
      className="cell"
      style={cellStyle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onClick}
    >
      {/* Render unit on top of the cell texture */}
      {unitTexture && <img src={unitTexture} className="unit-sprite" alt="unit" />}
      <div className="cell-overlay" style={overlayStyle}></div>
    </div>
  );
};

export default Cell;
