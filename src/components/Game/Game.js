import React, { useState, useMemo, useCallback, useEffect, useContext, useRef } from 'react';
import { TilesetContext } from '../../context/TilesetContext';
import { ResourceSetContext } from '../../context/ResourceSetContext';
import { NotificationContext } from '../../context/NotificationContext';
import GameGrid from '../GameGrid/GameGrid';
import MapDisplay from '../MapDisplay/MapDisplay';
import PlayerUI from '../PlayerUI/PlayerUI';
import CellDetailsMenu from '../CellDetailsMenu/CellDetailsMenu';
import CellTooltip from '../CellTooltip/CellTooltip';
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

let gameRenderCount = 0;
const Game = ({ mapData, gameSettings, onReturnToMenu }) => {
  const { tileset } = useContext(TilesetContext);
  const { resourceSet } = useContext(ResourceSetContext);
  const { addNotification } = useContext(NotificationContext);

  const [gamePhase, setGamePhase] = useState('LOADING');
  const [players, setPlayers] = useState([]);
  const [currentPlayerId, setCurrentPlayerId] = useState(0);
  const [units, setUnits] = useState([]);
  const [cities, setCities] = useState([]);
  
  const [selectedCell, setSelectedCell] = useState(null);
  const [tooltipData, setTooltipData] = useState({ visible: false, cell: null, position: { x: 0, y: 0 } });
  const hoverTimeoutRef = useRef(null);

  gameRenderCount++;
  console.log(`%c[Game] Render #${gameRenderCount}. Cities count: ${cities.length}`, 'color: teal', cities);

  useEffect(() => {
     if (gameSettings && gameSettings.players && mapData) {
      const playersFromSettings = gameSettings.players;
      const playerCount = playersFromSettings.length;
      const playerColors = generatePlayerColors(playerCount);
      const newPlayers = playersFromSettings.map((player, i) => ({ ...player, color: playerColors[i], isTurnFinished: false }));
      setPlayers(newPlayers);
      setGamePhase('SETUP');
      setCurrentPlayerId(0);
    }
  }, [gameSettings, mapData]);


  const handleCellClick = useCallback((row, col) => {
    if (gamePhase === 'SETUP') {
      console.log('%c[Game] handleCellClick in SETUP phase.', 'color: teal');
      const isOccupied = cities.some(c => c.row === row && c.col === col);
      if (isOccupied) {
        addNotification("A city has already been placed here. Choose another location.");
        return;
      }
      const newCity = { id: Date.now(), row, col, playerId: currentPlayerId };
      console.log('%c[Game] Creating new city. Calling setCities...', 'color: teal', newCity);
      setCities(prev => {
          const newState = [...prev, newCity];
          console.log('%c[Game] New cities state after adding:', 'color: teal', newState);
          return newState;
      });

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
    const cellUnits = units.filter(u => u.row === row && u.col === col);
    const cellCity = cities.find(c => c.row === row && c.col === col);
    const cellResources = mapData.grid[row][col].resources || [];
    setSelectedCell({ row, col, units: cellUnits, city: cellCity, resources: cellResources });
  }, [gamePhase, cities, currentPlayerId, players, addNotification, units, mapData]);

  const handleCellMouseEnter = (row, col) => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
          const cellUnits = units.filter(u => u.row === row && u.col === col);
          const cellCity = cities.find(c => c.row === row && c.col === col);
          const cellResourcesRaw = mapData.grid[row][col].resources || [];
          const resourcesAggregated = cellResourcesRaw.reduce((acc, resTypeId) => {
              const existing = acc.find(r => r.typeId === resTypeId);
              if (existing) existing.count++;
              else acc.push({ typeId: resTypeId, count: 1 });
              return acc;
          }, []);
          setTooltipData(prev => ({ ...prev, visible: true, cell: { row, col, units: cellUnits, city: cellCity, resources: resourcesAggregated } }));
      }, 500);
  };
  const handleCellMouseLeave = () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
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
            <PlayerUI players={players} currentPlayerId={currentPlayerId} onFinishTurn={()=>{}} onSwitchPlayer={()=>{}} />
            <CellDetailsMenu cellData={selectedCell} players={players} onSelectUnit={() => {}} onClose={() => setSelectedCell(null)} />
        </>
      );
    }
    return null;
  };

  return (
    <div className={`game-container`}>
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