import React from 'react';
import Cell from '../Cell/Cell';
import './GameGrid.css';

const GameGrid = ({ gridData, units = [], unitTexture, tints, onCellClick, editorMode = false }) => {
  if (!gridData || gridData.length === 0) {
    return null; // Don't render anything if there's no grid data
  }

  // Create a map of unit positions for quick lookup
  const unitMap = new Map();
  // This is now safe because 'units' will default to an empty array if not provided
  units.forEach(unit => {
    unitMap.set(`${unit.row}-${unit.col}`, unit);
  });

  return (
    <div className="game-grid">
      {gridData.map((row, rowIndex) => (
        <div key={rowIndex} className="grid-row">
          {row.map((cell, colIndex) => {
            const cellKey = `${rowIndex}-${colIndex}`;
            const unitOnCell = unitMap.get(cellKey);
            // Also make the 'tints' prop optional for safety
            const tintColor = tints ? tints[cellKey] : null; 
            
            return (
              <Cell
                key={cellKey}
                id={`cell-${cellKey}`} // ID is crucial for the arrow library
                texture={cell.texture}
                // Pass null for props that might not exist in the current mode
                unitTexture={unitOnCell ? unitTexture : null}
                tint={tintColor}
                // Only attach onClick if the handler function exists
                onClick={() => onCellClick && onCellClick(rowIndex, colIndex)}
                editorMode={editorMode}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default GameGrid;