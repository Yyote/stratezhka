import React, { useMemo } from 'react';
import Cell from '../Cell/Cell';
import './GameGrid.css';

const GameGrid = ({ mapData, tileset, units, cities, players, onCellClick }) => {
  const tileMap = useMemo(() => {
    if (!tileset) return new Map();
    return new Map(tileset.tiles.map(t => [t.type_name, t]));
  }, [tileset]);

  const entityMap = useMemo(() => {
    const map = new Map();
    const initCell = (key) => { if (!map.has(key)) map.set(key, { units: [], cities: [] }); };
    
    units.forEach(unit => {
      const key = `${unit.row}-${unit.col}`;
      initCell(key);
      map.get(key).units.push(unit);
    });
    cities.forEach(city => {
      const key = `${city.row}-${city.col}`;
      initCell(key);
      map.get(key).cities.push(city);
    });
    return map;
  }, [units, cities]);

  if (!mapData || !tileset) return null;

  return (
    <div className="game-grid">
      {mapData.grid.map((row, rowIndex) => (
        <div key={rowIndex} className="grid-row">
          {row.map((tileTypeName, colIndex) => {
            const cellKey = `${rowIndex}-${colIndex}`;
            const tile = tileMap.get(tileTypeName);
            const entities = entityMap.get(cellKey);
            return (
              <Cell
                key={cellKey}
                id={`cell-${cellKey}`}
                texture={tile?.textureUrl}
                entities={entities}
                players={players}
                onClick={() => onCellClick(rowIndex, colIndex)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default GameGrid;
