import React, { useState, useMemo, useCallback, useEffect, useContext } from 'react';
import { TilesetContext } from '../../context/TilesetContext';
import { NotificationContext } from '../../context/NotificationContext';
import GameGrid from '../GameGrid/GameGrid';
import MapDisplay from '../MapDisplay/MapDisplay';
import ActionArrow from '../ActionArrow/ActionArrow';
import PlayerUI from '../PlayerUI/PlayerUI';
import CellDetailsMenu from '../CellDetailsMenu/CellDetailsMenu';
import { Xwrapper } from 'react-xarrows';
import './Game.css';

import unitTexture from '../../assets/textures/unit.png';

const generatePlayerColors = (count) => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const hue = (360 / count) * i;
    colors.push(`hsl(${hue}, 90%, 60%)`);
  }
  return colors;
};

const Game = ({ mapData, gameSettings, onReturnToMenu }) => {
  const { tileset } = useContext(TilesetContext);
  const { addNotification } = useContext(NotificationContext);

  // Core Game State
  const [gamePhase, setGamePhase] = useState('LOADING');
  const [players, setPlayers] = useState([]);
  const [currentPlayerId, setCurrentPlayerId] = useState(0);
  const [units, setUnits] = useState([]);
  const [cities, setCities] = useState([]);
  const [actionQueue, setActionQueue] = useState({});
  const [nextUnitId, setNextUnitId] = useState(0);
  const [nextCityId, setNextCityId] = useState(0);

  // UI State
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [plannedAction, setPlannedAction] = useState(null);

  useEffect(() => {
    if (gameSettings && gameSettings.players && mapData) {
      const playersFromSettings = gameSettings.players;
      const playerCount = playersFromSettings.length;
      const playerColors = generatePlayerColors(playerCount);
      const newPlayers = playersFromSettings.map((player, i) => ({
        ...player,
        color: playerColors[i],
        isTurnFinished: false,
      }));
      setPlayers(newPlayers);
      const initialActionQueue = newPlayers.reduce((acc, p) => ({ ...acc, [p.id]: [] }), {});
      setActionQueue(initialActionQueue);
      setGamePhase('SETUP');
      setCurrentPlayerId(0);
    }
  }, [gameSettings, mapData]);

  const tileMap = useMemo(() => {
    if (!tileset) return new Map();
    return new Map(tileset.tiles.map(t => [t.type_name, t]));
  }, [tileset]);

  const handleInitiatePlaceUnit = () => {
    if (plannedAction?.type === 'PLACE_UNIT') {
      setPlannedAction(null);
      return;
    }
    setSelectedUnit(null);
    setSelectedCell(null);
    setPlannedAction({ type: 'PLACE_UNIT' });
    addNotification("Select one of your cities to queue unit production.", "info");
  };

  const handleCellClick = useCallback((row, col) => {
    if (gamePhase === 'SETUP') {
      const isOccupied = cities.some(c => c.row === row && c.col === col);
      if (isOccupied) {
        addNotification("A city has already been placed here. Choose another location.");
        return;
      }
      const newCity = { id: nextCityId, row, col, playerId: currentPlayerId };
      setCities(prev => [...prev, newCity]);
      setNextCityId(id => id + 1);
      const nextPlayerId = currentPlayerId + 1;
      if (nextPlayerId >= players.length) {
        setGamePhase('PLANNING');
        setCurrentPlayerId(0);
        addNotification("All cities placed. The planning phase has begun!", "success");
      } else {
        setCurrentPlayerId(nextPlayerId);
      }
      return;
    }

    if (plannedAction?.type === 'PLACE_UNIT') {
      const cityOnCell = cities.find(c => c.row === row && c.col === col);
      if (cityOnCell && cityOnCell.playerId === currentPlayerId) {
        const newAction = {
          type: 'CREATE_UNIT',
          target: { row, col },
          id: `action_${Date.now()}`
        };
        setActionQueue(prev => ({
          ...prev,
          [currentPlayerId]: [...prev[currentPlayerId], newAction]
        }));
        addNotification(`Unit queued for production at (${row}, ${col}).`, "success");
        setPlannedAction(null);
      } else {
        addNotification("You can only queue new units in your own cities.");
      }
      return;
    }

    if (plannedAction && plannedAction.unitId) {
      // Future target selection logic for move/attack
    } else {
        const cellUnits = units.filter(u => u.row === row && u.col === col);
        const cellCity = cities.find(c => c.row === row && c.col === col);
        setSelectedCell({ row, col, units: cellUnits, city: cellCity });
        setSelectedUnit(null);
    }
  }, [gamePhase, cities, currentPlayerId, players, nextCityId, addNotification, plannedAction, units]);

  const handleSwitchPlayer = useCallback(() => {
    // Find the next player who has NOT finished their turn yet
    let nextPlayerId = (currentPlayerId + 1) % players.length;
    // Loop to skip players who are already done
    while (players[nextPlayerId].isTurnFinished && nextPlayerId !== currentPlayerId) {
      nextPlayerId = (nextPlayerId + 1) % players.length;
    }

    setCurrentPlayerId(nextPlayerId);
    setSelectedUnit(null);
    setSelectedCell(null);
    setPlannedAction(null);
  }, [players, currentPlayerId]);

  const handleFinishTurn = () => {
    // Mark the current player as having finished their turn
    const updatedPlayers = players.map(p =>
      p.id === currentPlayerId ? { ...p, isTurnFinished: true } : p
    );
    setPlayers(updatedPlayers);

    // Check if all players are now finished
    const allFinished = updatedPlayers.every(p => p.isTurnFinished);

    if (allFinished) {
      // If everyone is done, move to the execution phase
      setGamePhase('EXECUTING');
      addNotification("All players have finished. Executing actions...", "info");
      // In a real game, you would start processing the actionQueue here
    } else {
      // If not, automatically switch to the next available player
      addNotification(`${players[currentPlayerId].name} finished their turn. Switching to next player.`, "info");
      handleSwitchPlayer(); // This will find the next player who isn't finished
    }
    // Reset selections
    setSelectedUnit(null);
    setSelectedCell(null);
    setPlannedAction(null);
  };

  if (gamePhase === 'LOADING' || !mapData) {
      return <div className="loading-screen"><h1>Loading Map...</h1></div>;
  }
  
  const renderPhaseSpecificUI = () => {
    if (gamePhase === 'SETUP') {
      const currentPlayer = players[currentPlayerId];
      if (!currentPlayer) return null;
      return (
        <div className="setup-overlay">
          <h2>Setup Phase</h2>
          <p>Player <span style={{ color: currentPlayer.color }}>{currentPlayer.name}</span>, place your starting city.</p>
        </div>
      );
    }
    if (gamePhase === 'PLANNING') {
      return (
        <>
            <PlayerUI players={players} currentPlayerId={currentPlayerId} onFinishTurn={handleFinishTurn} onSwitchPlayer={handleSwitchPlayer} />
            <CellDetailsMenu cellData={selectedCell} players={players} onSelectUnit={() => {}} onClose={() => setSelectedCell(null)} />
             {selectedUnit && ( <div className="action-menu"> {/* Placeholder */} </div> )}
        </>
      );
    }
    if (gamePhase === 'EXECUTING') {
        return (
          <div className="setup-overlay">
            <h2>Executing Actions...</h2>
            {/* This is where you would show the results of the turn */}
          </div>
        );
    }
    return null;
  };
  
  return (
    <div className={`game-container ${gamePhase === 'SETUP' ? 'setup-mode' : ''} ${plannedAction?.type === 'PLACE_UNIT' ? 'placing-mode' : ''}`}>
        <div className="game-controls-panel">
          {gamePhase === 'PLANNING' && (
            <>
              <h2>Controls</h2>
              <button
                onClick={handleInitiatePlaceUnit}
                className={plannedAction?.type === 'PLACE_UNIT' ? 'active' : ''}
              >
                {plannedAction?.type === 'PLACE_UNIT' ? 'Cancel Placement' : 'Place Unit'}
              </button>
            </>
          )}
        </div>
        
        <div className="game-main-area">
            <div className="game-header"><h1>Playing: {mapData.name}</h1></div>
            <div className="game-viewport-wrapper">
                <Xwrapper>
                    <MapDisplay>
                        <GameGrid 
                            mapData={mapData} 
                            tileset={tileset}
                            units={units} 
                            cities={cities} 
                            players={players}
                            onCellClick={handleCellClick} 
                        />
                    </MapDisplay>
                    {/* Arrow rendering will go here */}
                </Xwrapper>
            </div>
        </div>
        
        {renderPhaseSpecificUI()}
    </div>
  );
};

export default Game;
