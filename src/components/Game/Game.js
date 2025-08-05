import React, { useState, useMemo, useCallback, useEffect, useContext, useRef } from 'react';
import { TilesetContext } from '../../context/TilesetContext';
import { ResourceSetContext } from '../../context/ResourceSetContext';
import { ResearchSetContext } from '../../context/ResearchSetContext';
import { UnitsetContext } from '../../context/UnitsetContext';
import { BuildingsetContext } from '../../context/BuildingsetContext';
import { NotificationContext } from '../../context/NotificationContext';
import GameGrid from '../GameGrid/GameGrid';
import MapDisplay from '../MapDisplay/MapDisplay';
import PlayerUI from '../PlayerUI/PlayerUI';
import CellDetailsMenu from '../CellDetailsMenu/CellDetailsMenu';
import CellTooltip from '../CellTooltip/CellTooltip';
import ActionMenu from '../ActionMenu/ActionMenu';
import { Xwrapper } from 'react-xarrows';
import './Game.css';

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
  const { resourceSet } = useContext(ResourceSetContext);
  const { researchSet } = useContext(ResearchSetContext);
  const { unitSet } = useContext(UnitsetContext);
  const { buildingSet } = useContext(BuildingsetContext);
  const { addNotification } = useContext(NotificationContext);

  // Core Game State
  const [gamePhase, setGamePhase] = useState('LOADING');
  const [players, setPlayers] = useState([]);
  const [currentPlayerId, setCurrentPlayerId] = useState(0);
  const [units, setUnits] = useState([]);
  const [cities, setCities] = useState([]); // This now holds ALL buildings
  
  // UI State
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [placementMode, setPlacementMode] = useState(null); // e.g. {type: 'building', typeId: 'barracks'}
  const [tooltipData, setTooltipData] = useState({ visible: false, cell: null, position: { x: 0, y: 0 } });
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    if (gameSettings && gameSettings.players && mapData && resourceSet) {
      const initialResources = resourceSet.resources.reduce((acc, res) => ({...acc, [res.TypeId]: 0}), {});
      const playersFromSettings = gameSettings.players;
      const playerColors = generatePlayerColors(playersFromSettings.length);
      const newPlayers = playersFromSettings.map((player, i) => ({
        ...player,
        color: playerColors[i],
        isTurnFinished: false,
        resources: { ...initialResources },
        completedResearch: [], // Player now tracks completed research
      }));
      setPlayers(newPlayers);
      setGamePhase('SETUP');
      setCurrentPlayerId(0);
    }
  }, [gameSettings, mapData, resourceSet]);

  useEffect(() => {
    if (gamePhase === 'EXECUTING') {
        const resolveTimeout = setTimeout(() => resolveTurn(), 500);
        return () => clearTimeout(resolveTimeout);
    }
  }, [gamePhase]);

  const resolveTurn = () => {
    console.log("--- Resolving Turn ---");
    let updatedPlayers = JSON.parse(JSON.stringify(players)); // Deep copy to avoid mutation issues

    // --- 1. Resource Generation ---
    updatedPlayers.forEach(player => {
      const playerCities = cities.filter(c => c.playerId === player.id);
      if (playerCities.length === 0) return;

      const resourceSources = {};
      
      playerCities.forEach(city => {
        const cellResources = mapData.grid[city.row][city.col].resources || [];
        cellResources.forEach(resTypeId => {
          resourceSources[resTypeId] = (resourceSources[resTypeId] || 0) + 1;
        });
      });

      let gainsMessage = `${player.name} gained: `;
      let gainedSomething = false;

      Object.entries(resourceSources).forEach(([resTypeId, count]) => {
        const gain = count * (Math.floor(Math.random() * 10) + 1);
        player.resources[resTypeId] = (player.resources[resTypeId] || 0) + gain;
        gainsMessage += `${gain} ${resTypeId}, `;
        gainedSomething = true;
      });

      if(gainedSomething) {
          addNotification(gainsMessage.slice(0, -2), 'success');
      }
    });

    // --- 2. Reset for Next Turn ---
    updatedPlayers = updatedPlayers.map(p => ({ ...p, isTurnFinished: false }));
    
    setPlayers(updatedPlayers);
    setCurrentPlayerId(0);
    setGamePhase('PLANNING');
    addNotification("New turn has begun!", "info");
  };
  
  const handleInitiatePlacement = (buildingTypeId) => {
      setPlacementMode({ type: 'building', typeId: buildingTypeId });
      setSelectedBuilding(null);
      setSelectedCell(null);
      addNotification(`Placing ${buildingTypeId}. Click on a valid tile.`, 'info');
  };

  const handleQueueUnit = (buildingId, unitTypeId) => {
      addNotification(`Queued ${unitTypeId} at building ${buildingId}.`, 'success');
      // In a real game, you would add this to the building's production queue.
      setSelectedBuilding(null); // Close menu after action
  };
  
  const handleQueueResearch = (researchTypeId) => {
      // For now, research is instant.
      setPlayers(prevPlayers => prevPlayers.map(p => {
          if (p.id === currentPlayerId) {
              return { ...p, completedResearch: [...p.completedResearch, researchTypeId] };
          }
          return p;
      }));
      addNotification(`Research complete: ${researchTypeId}!`, 'success');
      setSelectedBuilding(null); // Close menu
  };


  const handleCellClick = useCallback((row, col) => {
    // If in placement mode, try to place the building.
    if (placementMode) {
        // Future logic: check if tile is valid for placement (e.g., near a road)
        const buildingTemplate = buildingSet.buildings.find(b => b.TypeId === placementMode.typeId);
        const newBuilding = { ...buildingTemplate, id: Date.now(), row, col, playerId: currentPlayerId };
        setCities(prev => [...prev, newBuilding]);
        addNotification(`${newBuilding.name} placed!`, 'success');
        setPlacementMode(null); // Exit placement mode
        return;
    }
    
    if (gamePhase === 'SETUP') {
      const isOccupied = cities.some(c => c.row === row && c.col === col);
      if (isOccupied) { addNotification("A city has already been placed here."); return; }
      const newCity = {
          TypeId: 'city', // Assuming a generic city type for now
          name: 'City',
          ...buildingSet.buildings.find(b => b.TypeId === 'city'), // Find a base city definition if it exists
          id: Date.now(), row, col, playerId: currentPlayerId 
      };
      setCities(prev => [...prev, newCity]);
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

    // Standard cell click logic
    const buildingOnCell = cities.find(c => c.row === row && c.col === col);
    if (buildingOnCell && buildingOnCell.playerId === currentPlayerId) {
        setSelectedBuilding(buildingOnCell);
        setSelectedCell(null);
    } else {
        const cellUnits = units.filter(u => u.row === row && u.col === col);
        const cellResources = mapData.grid[row][col].resources || [];
        setSelectedCell({ row, col, units: cellUnits, city: buildingOnCell, resources: cellResources });
        setSelectedBuilding(null);
    }
  }, [gamePhase, cities, currentPlayerId, players, addNotification, units, mapData, placementMode, buildingSet]);

  const handleFinishTurn = () => {
    const updatedPlayers = players.map(p =>
      p.id === currentPlayerId ? { ...p, isTurnFinished: true } : p
    );
    setPlayers(updatedPlayers);

    const allFinished = updatedPlayers.every(p => p.isTurnFinished);

    if (allFinished) {
      setGamePhase('EXECUTING');
      addNotification("All players have finished. Executing turn...", "info");
    } else {
      handleSwitchPlayer();
    }
  };
  const handleSwitchPlayer = useCallback(() => {
    let nextPlayerId = (currentPlayerId + 1) % players.length;
    while (players[nextPlayerId].isTurnFinished && nextPlayerId !== currentPlayerId) {
      nextPlayerId = (nextPlayerId + 1) % players.length;
    }
    setCurrentPlayerId(nextPlayerId);
    setSelectedCell(null);
  }, [players, currentPlayerId]);

  const handleCellMouseEnter = (row, col) => {
      if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
      }
      hoverTimeoutRef.current = setTimeout(() => {
          const cellUnits = units.filter(u => u.row === row && u.col === col);
          const cellCity = cities.find(c => c.row === row && c.col === col);
          const cellResourcesRaw = mapData.grid[row][col].resources || [];

          const resourcesAggregated = cellResourcesRaw.reduce((acc, resTypeId) => {
              const existing = acc.find(r => r.typeId === resTypeId);
              if (existing) {
                  existing.count++;
              } else {
                  acc.push({ typeId: resTypeId, count: 1 });
              }
              return acc;
          }, []);

          setTooltipData(prev => ({
              ...prev,
              visible: true,
              cell: { row, col, units: cellUnits, city: cellCity, resources: resourcesAggregated }
          }));
      }, 500);
  };

  const handleCellMouseLeave = () => {
      if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
      }
      setTooltipData(prev => ({ ...prev, visible: false }));
  };

  const handleCellMouseMove = (e) => {
      setTooltipData(prev => ({ ...prev, position: { x: e.clientX, y: e.clientY } }));
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
            <PlayerUI players={players} currentPlayerId={currentPlayerId} resourceSet={resourceSet} buildingSet={buildingSet} onFinishTurn={handleFinishTurn} onSwitchPlayer={handleSwitchPlayer} onInitiatePlacement={handleInitiatePlacement} />
            <CellDetailsMenu cellData={selectedCell} players={players} onSelectUnit={() => {}} onClose={() => setSelectedCell(null)} />
            {selectedBuilding && (
                <ActionMenu
                    building={selectedBuilding}
                    player={players.find(p => p.id === currentPlayerId)}
                    unitSet={unitSet}
                    researchSet={researchSet}
                    onQueueUnit={handleQueueUnit}
                    onQueueResearch={handleQueueResearch}
                    onClose={() => setSelectedBuilding(null)}
                />
            )}
        </>
      );
    }
    if (gamePhase === 'EXECUTING') {
        return (
          <div className="setup-overlay">
            <h2>Executing Actions...</h2>
          </div>
        );
    }
    return null;
  };
  
  return (
    <div className={`game-container ${placementMode ? 'placing-mode' : ''}`}>
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
                            onCellMouseEnter={handleCellMouseEnter}
                            onCellMouseLeave={handleCellMouseLeave}
                            onCellMouseMove={handleCellMouseMove}
                        />
                    </MapDisplay>
                </Xwrapper>
            </div>
        </div>
        
        {renderPhaseSpecificUI()}
        <CellTooltip tooltipData={tooltipData} players={players} resourceSet={resourceSet} />
    </div>
  );
};

export default Game;