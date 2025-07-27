import React from 'react';
import Cell from '../Cell/Cell';
import './GameGrid.css';

const GameGrid = ({ gridData, onCellClick, editorMode = false }) => {
  if (!gridData || gridData.length === 0) {
    return null; // Don't render anything if there's no grid data
  }

  return (
    <div className="game-grid">
      {gridData.map((row, rowIndex) => (
        <div key={rowIndex} className="grid-row">
          {row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              texture={cell.texture}
              editorMode={editorMode}
              // Pass the click handler down, which will do different things
              // depending on the mode (paint vs. select)
              onClick={() => onCellClick && onCellClick(rowIndex, colIndex)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default GameGrid;
