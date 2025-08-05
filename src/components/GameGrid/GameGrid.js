import React, { useMemo } from 'react';
import Cell from '../Cell/Cell';
import './GameGrid.css';

let gridRenderCount = 0;
const GameGrid = ({ mapData, tileset, units = [], cities = [], players = [], onCellClick, onCellMouseEnter, onCellMouseLeave, onCellMouseMove, onCellContextMenu, editorMode = false }) => {
  gridRenderCount++;
  console.log(`%c[GameGrid] Render #${gridRenderCount}. Mode: ${editorMode ? 'Editor' : 'Game'}. Received ${cities.length} cities.`, 'color: blue', cities);

  const tileMap = useMemo(() => {
    if (!tileset) return new Map();
    return new Map(tileset.tiles.map(t => [t.type_name, t]));
  }, [tileset]);

  const entitiesGrid = useMemo(() => {
    if (editorMode || !mapData) return null;
    console.log('%c[GameGrid] Recalculating entitiesGrid with cities:', 'color: blue', cities);
    const grid = mapData.grid.map(row => row.map(() => ({ units: [], cities: [] })));
    units.forEach(unit => { if (grid[unit.row]?.[unit.col]) grid[unit.row][unit.col].units.push(unit); });
    cities.forEach(city => { if (grid[city.row]?.[city.col]) grid[city.row][city.col].cities.push(city); });
    console.log('%c[GameGrid] entitiesGrid calculation complete.', 'color: blue', grid.flat().filter(c => c.cities.length > 0));
    return grid;
  }, [mapData, units, cities, editorMode]);


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