import React, { useState, useMemo, useRef, useContext } from 'react';
import { TilesetContext } from '../../context/TilesetContext';
import GameGrid from '../GameGrid/GameGrid';
import MapDisplay from '../MapDisplay/MapDisplay';
import ActionArrow from '../ActionArrow/ActionArrow';
import { Xwrapper } from 'react-xarrows';
import './Game.css';

// We only need the unit texture here now
import unitTexture from '../../assets/textures/unit.png';

const Game = ({ mapData, onReturnToMenu }) => {
  const { tileset } = useContext(TilesetContext);
  const [units, setUnits] = useState([]);
  const [nextUnitId, setNextUnitId] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [actionMode, setActionMode] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);

  const tileMap = useMemo(() => {
    return new Map(tileset.tiles.map(t => [t.type_name, t]));
  }, [tileset]);

  const getNeighbors = (row, col, radius = 1) => {
    const neighbors = [];
    for (let r = row - radius; r <= row + radius; r++) {
      for (let c = col - radius; c <= col + radius; c++) {
        if (r === row && c === col) continue;
        if (r >= 0 && r < mapData.height && c >= 0 && c < mapData.width) {
          neighbors.push({ row: r, col: c });
        }
      }
    }
    return neighbors;
  };

  const handlePlaceUnit = () => {
    const grassTileType = tileset.tiles.find(t => t.type_name === 'grass');
    const defaultTileType = tileset.tiles[0];
    const placeableTileTypeName = grassTileType ? 'grass' : defaultTileType?.type_name;

    if (!placeableTileTypeName) {
        alert("Cannot place unit: Tileset has no valid tiles.");
        return;
    }

    for (let r = 0; r < mapData.height; r++) {
      for (let c = 0; c < mapData.width; c++) {
        const isOccupied = units.some(u => u.row === r && u.col === c);
        if (mapData.grid[r][c] === placeableTileTypeName && !isOccupied) {
          const newUnit = { id: nextUnitId, row: r, col: c };
          setUnits([...units, newUnit]);
          setNextUnitId(nextUnitId + 1);
          return;
        }
      }
    }
    alert(`No available "${placeableTileTypeName}" tiles to place a unit!`);
  };

  const handleCellClick = (row, col) => {
    if (actionMode) {
      const neighbors = getNeighbors(selectedUnit.row, selectedUnit.col);
      const isTargetable = neighbors.some(n => n.row === row && n.col === col);
      if (isTargetable) {
        setActionTarget({ row, col, type: actionMode });
        setActionMode(null);
      }
      return;
    }

    const clickedUnit = units.find(u => u.row === row && u.col === col);
    setSelectedUnit(clickedUnit || null);
  };

  const handleAction = (mode) => {
    setActionMode(mode);
  };

  const handleDismissAction = () => {
    if (!actionTarget) return;

    if (actionTarget.type === 'moving') {
      const targetTileName = mapData.grid[actionTarget.row][actionTarget.col];
      const targetTileType = tileMap.get(targetTileName);
      
      if (!targetTileType || !targetTileType.ground_passable) {
        alert("Cannot move there! The terrain is impassable.");
      } else {
        const targetIsOccupied = units.some(u => u.row === actionTarget.row && u.col === actionTarget.col);
        if (targetIsOccupied) {
          alert("Cannot move to an occupied tile!");
        } else {
          const newUnits = units.map(u =>
            u.id === selectedUnit.id ? { ...u, row: actionTarget.row, col: actionTarget.col } : u
          );
          setUnits(newUnits);
        }
      }
    } else if (actionTarget.type === 'attacking') {
      console.log(`Unit ${selectedUnit.id} attacks cell (${actionTarget.row}, ${actionTarget.col})!`);
    }

    setActionTarget(null);
    setSelectedUnit(null);
  };

  const textureGrid = useMemo(() => {
    if (!mapData || !mapData.grid) return [];
    return mapData.grid.map(row =>
      row.map(tileTypeName => ({ texture: tileMap.get(tileTypeName)?.textureUrl || null }))
    );
  }, [mapData, tileMap]);

  const actionTints = useMemo(() => {
    if (!selectedUnit || !actionMode) return {};
    const tints = {};
    const neighbors = getNeighbors(selectedUnit.row, selectedUnit.col);
    const color = actionMode === 'moving' ? 'blue' : 'red';
    neighbors.forEach(n => {
      tints[`${n.row}-${n.col}`] = color;
    });
    return tints;
  }, [selectedUnit, actionMode]);

  const arrowData = useMemo(() => {
    if (!actionTarget || !selectedUnit) return null;
    const arrowColor = actionTarget.type === 'attacking' ? 'tomato' : 'cornflowerblue';
    return {
      startId: `cell-${selectedUnit.row}-${selectedUnit.col}`,
      endId: `cell-${actionTarget.row}-${actionTarget.col}`,
      color: arrowColor,
    };
  }, [actionTarget, selectedUnit]);

  if (!mapData) {
    return (
      <div>
        <h2>Error: No map data loaded.</h2>
        <button onClick={onReturnToMenu}>Return to Main Menu</button>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-controls-panel">
        <h2>Controls</h2>
        <button onClick={handlePlaceUnit}>Place Unit</button>
      </div>

      <div className="game-main-area">
        <div className="game-header">
          <h1>Playing: {mapData.name}</h1>
          <button onClick={onReturnToMenu}>Exit to Main Menu</button>
        </div>

        <div className="game-viewport-wrapper">
          <Xwrapper SVGcanvasStyle={{ position: 'absolute', top: 0, left: 0, zIndex: 10, pointerEvents: 'none' }}>
            <MapDisplay>
              <GameGrid
                gridData={textureGrid}
                units={units}
                unitTexture={unitTexture}
                tints={actionTints}
                onCellClick={handleCellClick}
              />
            </MapDisplay>
            {arrowData && <ActionArrow {...arrowData} />}
          </Xwrapper>
        </div>
      </div>

      {selectedUnit && (
        <div className="action-menu" style={{ position: 'absolute', left: '50%', bottom: '50px', transform: 'translateX(-50%)' }}>
          {!actionMode && !actionTarget && (
            <>
              <button onClick={() => handleAction('moving')}>Move</button>
              <button onClick={() => handleAction('attacking')}>Attack</button>
              <button onClick={() => setSelectedUnit(null)}>Cancel</button>
            </>
          )}
          {actionMode && (<button onClick={() => setActionMode(null)}>Cancel</button>)}
          {actionTarget && (
            <>
              <button onClick={handleDismissAction}>Dismiss Action</button>
              <button onClick={() => { setActionTarget(null); setSelectedUnit(null); }}>Cancel</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Game;
