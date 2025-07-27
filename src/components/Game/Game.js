import React, { useState, useMemo, useRef, useContext, useCallback } from 'react';
import { TilesetContext } from '../../context/TilesetContext';
import { NotificationContext } from '../../context/NotificationContext';
import GameGrid from '../GameGrid/GameGrid';
import MapDisplay from '../MapDisplay/MapDisplay';
import ActionArrow from '../ActionArrow/ActionArrow';
import { Xwrapper } from 'react-xarrows';
import './Game.css';

import unitTexture from '../../assets/textures/unit.png';

const Game = ({ mapData, onReturnToMenu }) => {
  const { tileset } = useContext(TilesetContext);
  const { addNotification } = useContext(NotificationContext);
  
  const [units, setUnits] = useState([]);
  const [nextUnitId, setNextUnitId] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [actionMode, setActionMode] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);
  const [isPlacingUnit, setIsPlacingUnit] = useState(false); // New state for placement mode

  const tileMap = useMemo(() => {
    if (!tileset) return new Map();
    return new Map(tileset.tiles.map(t => [t.type_name, t]));
  }, [tileset]);

  const getNeighbors = useCallback((row, col, radius = 1) => {
    const neighbors = [];
    if (!mapData) return neighbors;
    for (let r = row - radius; r <= row + radius; r++) {
      for (let c = col - radius; c <= col + radius; c++) {
        if (r === row && c === col) continue;
        if (r >= 0 && r < mapData.height && c >= 0 && c < mapData.width) {
          neighbors.push({ row: r, col: c });
        }
      }
    }
    return neighbors;
  }, [mapData]);

  const handlePlaceUnitClick = () => {
    if (selectedUnit) {
      setSelectedUnit(null);
      setActionTarget(null);
      setActionMode(null);
    }
    setIsPlacingUnit(prev => !prev);
  };

  const handleCellClick = useCallback((row, col) => {
    if (isPlacingUnit) {
      const targetTileName = mapData.grid[row][col];
      const targetTileType = tileMap.get(targetTileName);

      if (!targetTileType?.ground_passable) {
        addNotification("Cannot place a unit on impassable terrain.");
        return;
      }
      
      const isOccupied = units.some(u => u.row === row && u.col === col);
      if (isOccupied) {
        addNotification("Cannot place a unit on an occupied tile.");
        return;
      }

      const newUnit = { id: nextUnitId, row, col };
      setUnits(prevUnits => [...prevUnits, newUnit]);
      setNextUnitId(id => id + 1);
      setIsPlacingUnit(false); // Exit placement mode automatically
      return;
    }

    if (actionMode && selectedUnit) {
      const neighbors = getNeighbors(selectedUnit.row, selectedUnit.col);
      if (neighbors.some(n => n.row === row && n.col === col)) {
        setActionTarget({ row, col, type: actionMode });
        setActionMode(null);
      }
      return;
    }

    const clickedUnit = units.find(u => u.row === row && u.col === col);
    setSelectedUnit(clickedUnit || null);
    setActionTarget(null);
  }, [isPlacingUnit, actionMode, selectedUnit, units, getNeighbors, mapData, tileMap, addNotification, nextUnitId]);

  const handleAction = useCallback((mode) => {
    setActionMode(mode);
  }, []);

  const handleDismissAction = useCallback(() => {
    if (!actionTarget || !selectedUnit) return;

    if (actionTarget.type === 'moving') {
      const targetTileName = mapData.grid[actionTarget.row][actionTarget.col];
      const targetTileType = tileMap.get(targetTileName);
      
      if (!targetTileType?.ground_passable) {
        addNotification("Cannot move there! The terrain is impassable.");
      } else {
        const targetIsOccupied = units.some(u => u.row === actionTarget.row && u.col === actionTarget.col);
        if (targetIsOccupied) {
          addNotification("Cannot move to an occupied tile!");
        } else {
          setUnits(prevUnits => prevUnits.map(u =>
            u.id === selectedUnit.id ? { ...u, row: actionTarget.row, col: actionTarget.col } : u
          ));
        }
      }
    } else if (actionTarget.type === 'attacking') {
      console.log(`Unit ${selectedUnit.id} attacks cell (${actionTarget.row}, ${actionTarget.col})!`);
    }

    setActionTarget(null);
    setSelectedUnit(null);
  }, [actionTarget, selectedUnit, units, mapData, tileMap, addNotification]);

  const textureGrid = useMemo(() => {
    if (!mapData || !tileMap) return [];
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
  }, [selectedUnit, actionMode, getNeighbors]);

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
    <div className={`game-container ${isPlacingUnit ? 'placing-mode' : ''}`}>
      <div className="game-controls-panel">
        <h2>Controls</h2>
        <button
          onClick={handlePlaceUnitClick}
          className={isPlacingUnit ? 'active' : ''}
        >
          {isPlacingUnit ? 'Cancel Placement' : 'Place Unit'}
        </button>
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
