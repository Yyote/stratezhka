import React, { useMemo } from 'react';
import Cell from '../Cell/Cell';
import './GameGrid.css';

const GameGrid = ({ mapData, tileset, units = [], buildings = [], players = [], onCellClick, onCellMouseEnter, onCellMouseLeave, onCellMouseMove, onCellContextMenu, editorMode = false }) => {
  const tileMap = useMemo(() => {
    if (!tileset) return new Map();
    return new Map(tileset.tiles.map(t => [t.type_name, t]));
  }, [tileset]);

  const entitiesGrid = useMemo(() => {
    if (editorMode || !mapData) return null;

    const grid = mapData.grid.map(row => row.map(() => ({ units: [], buildings: [] })));
    
    units.forEach(unit => { if (grid[unit.pos.row]?.[unit.pos.col]) grid[unit.pos.row][unit.pos.col].units.push(unit); });
    buildings.forEach(building => { if (grid[building.pos.row]?.[building.pos.col]) grid[building.pos.row][building.pos.col].buildings.push(building); });
    
    return grid;
  }, [mapData, units, buildings, editorMode]);


  if (!mapData || !tileset) {
    return null;
  }

  return (
    <div className="game-grid">
      {mapData.grid.map((row, rowIndex) => (
        <div key={rowIndex} className="grid-row">
          {row.map((cell, colIndex) => {
            const tileTypeName = cell.tile;
            const resources = cell.resources;
            const texture = tileMap.get(tileTypeName)?.textureUrl || null;
            const entities = entitiesGrid ? entitiesGrid[rowIndex][colIndex] : undefined;
            const cellKey = `${rowIndex}-${colIndex}`;

            return (
              <Cell
                key={cellKey}
                id={`cell-${cellKey}`}
                cellData={{ texture, resources }}
                entities={entities}
                players={players}
                onClick={() => onCellClick && onCellClick(rowIndex, colIndex)}
                onContextMenu={(e) => onCellContextMenu && onCellContextMenu(e, rowIndex, colIndex)}
                onMouseEnter={() => onCellMouseEnter && onCellMouseEnter(rowIndex, colIndex)}
                onMouseLeave={() => onCellMouseLeave && onCellMouseLeave()}
                onMouseMove={(e) => onCellMouseMove && onCellMouseMove(e)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default GameGrid;