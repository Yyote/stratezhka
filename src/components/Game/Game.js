import React, { useContext, useState, useRef } from 'react';
import { GameContext, GameProvider } from '../../context/GameContext';
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
import EntityChoiceModal from '../EntityChoiceModal/EntityChoiceModal';
import { Xwrapper } from 'react-xarrows';
import './Game.css';

const GameView = () => {
    const { gameState, dispatch } = useContext(GameContext);
    const { addNotification } = useContext(NotificationContext);
    const { map, players, units, buildings, currentPlayerId, gamePhase, turn, staticData } = gameState;

    const [selectedCell, setSelectedCell] = useState(null);
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [placementMode, setPlacementMode] = useState(null);
    const [tooltipData, setTooltipData] = useState({ visible: false, cell: null, position: { x: 0, y: 0 } });
    const [choiceRequired, setChoiceRequired] = useState(null);
    const hoverTimeoutRef = useRef(null);
    
    const currentPlayer = players[currentPlayerId];

    const handleInitiatePlacement = (buildingTypeId, isAffordable) => {
        if (!isAffordable) {
            addNotification("You cannot afford this building.", "error");
            return;
        }
        setPlacementMode({ typeId: buildingTypeId });
        setSelectedCell(null);
        addNotification(`Placing ${buildingTypeId}. Click on a valid tile.`, 'info');
    };

    const handleCellClick = (row, col) => {
        if (placementMode) {
            dispatch({ type: 'PLACE_BUILDING', payload: { buildingTypeId: placementMode.typeId, row, col } });
            setPlacementMode(null);
            return;
        }
        
        if (gamePhase === 'SETUP') {
            dispatch({ type: 'PLACE_STARTING_CITY', payload: { row, col } });
            return;
        }
        
        const buildingsOnCell = buildings.filter(b => b.pos.row === row && b.pos.col === col);
        const friendlyBuildings = buildingsOnCell.filter(b => b.playerId === currentPlayerId);

        if (friendlyBuildings.length === 0) {
            // Empty or enemy cell, just show details
            const cellUnits = units.filter(u => u.pos.row === row && u.pos.col === col);
            setSelectedCell({ row, col, units: cellUnits, city: buildingsOnCell.find(b => b.TypeId === 'city') });
            setSelectedBuilding(null);
        } else if (friendlyBuildings.length === 1) {
            // Single friendly building
            const building = friendlyBuildings[0];
            if (building.TypeId === 'city') {
                setSelectedCell({ row, col, units: [], city: building });
            } else {
                setSelectedBuilding(building);
            }
        } else {
            // Multiple friendly buildings
            const city = friendlyBuildings.find(b => b.TypeId === 'city');
            const otherBuilding = friendlyBuildings.find(b => !b.isRoad && b.TypeId !== 'city');

            if (city && otherBuilding) {
                // If there's a city AND another building, prompt for choice
                setChoiceRequired([city, otherBuilding]);
            } else if (otherBuilding) {
                // If there's a road and another building, prioritize the other building
                setSelectedBuilding(otherBuilding);
            } else if (city) {
                // If it's just a city and a road, open the city's build menu
                setSelectedCell({ row, col, units: [], city: city });
            }
        }
    };
    
    const handleFinishTurn = () => dispatch({ type: 'END_TURN' });
    const handleSwitchPlayer = () => dispatch({ type: 'SWITCH_PLAYER' });
    const handleQueueUnit = (buildingId, unitTypeId) => { addNotification(`Queued ${unitTypeId}.`); setSelectedBuilding(null); };
    const handleQueueResearch = (researchTypeId) => { addNotification(`Queued ${researchTypeId}.`); setSelectedBuilding(null); };

    const handleCellMouseEnter = (row, col) => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            const cellUnits = units.filter(u => u.pos.row === row && u.pos.col === col);
            const buildingOnCell = buildings.find(b => b.pos.row === row && b.pos.col === col);
            const cellResourcesRaw = map.grid[row][col].resources || [];
            const resourcesAggregated = cellResourcesRaw.reduce((acc, resTypeId) => {
                const existing = acc.find(r => r.typeId === resTypeId);
                if (existing) existing.count++;
                else acc.push({ typeId: resTypeId, count: 1 });
                return acc;
            }, []);
            setTooltipData(prev => ({ ...prev, visible: true, cell: { row, col, units: cellUnits, city: buildingOnCell, resources: resourcesAggregated } }));
        }, 500);
    };
    const handleCellMouseLeave = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setTooltipData(prev => ({ ...prev, visible: false }));
    };
    const handleCellMouseMove = (e) => {
        setTooltipData(prev => ({ ...prev, position: { x: e.clientX, y: e.clientY } }));
    };


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
                    <PlayerUI players={players} currentPlayerId={currentPlayerId} resourceSet={staticData.resourceSet} onFinishTurn={handleFinishTurn} onSwitchPlayer={handleSwitchPlayer} />
                    <CellDetailsMenu
                        cellData={selectedCell}
                        player={currentPlayer}
                        players={players}
                        buildingSet={staticData.buildingSet}
                        resourceSet={staticData.resourceSet}
                        onInitiatePlacement={handleInitiatePlacement}
                        onClose={() => setSelectedCell(null)}
                    />
                    {selectedBuilding && (
                        <ActionMenu
                            building={selectedBuilding}
                            player={currentPlayer}
                            unitSet={staticData.unitSet}
                            researchSet={staticData.researchSet}
                            onQueueUnit={handleQueueUnit}
                            onQueueResearch={handleQueueResearch}
                            onClose={() => setSelectedBuilding(null)}
                        />
                    )}
                    {choiceRequired && (
                        <EntityChoiceModal
                            buildings={choiceRequired}
                            onSelect={(building) => {
                                if (building.TypeId === 'city') {
                                    setSelectedCell({ row: building.pos.row, col: building.pos.col, city: building });
                                } else {
                                    setSelectedBuilding(building);
                                }
                                setChoiceRequired(null);
                            }}
                            onClose={() => setChoiceRequired(null)}
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
                 <div className="game-header"><h1>Playing: {map.name} (Turn {turn})</h1></div>
                <div className="game-viewport-wrapper">
                    <Xwrapper>
                        <MapDisplay>
                            <GameGrid
                                mapData={map}
                                tileset={staticData.tileset}
                                units={units}
                                buildings={buildings}
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
            <CellTooltip tooltipData={tooltipData} players={players} resourceSet={staticData.resourceSet} />
        </div>
    );
};

const Game = ({ mapData, gameSettings, onReturnToMenu }) => {
    const { tileset } = useContext(TilesetContext);
    const { resourceSet } = useContext(ResourceSetContext);
    const { researchSet } = useContext(ResearchSetContext);
    const { unitSet } = useContext(UnitsetContext);
    const { buildingSet } = useContext(BuildingsetContext);

    if (!tileset || !resourceSet || !researchSet || !unitSet || !buildingSet) {
        return (
            <div className="loading-screen">
                <h1>Error: A required asset set is not loaded.</h1>
                <button onClick={onReturnToMenu}>Return to Main Menu</button>
            </div>
        );
    }

    return (
        <GameProvider
            mapData={mapData}
            gameSettings={gameSettings}
            tileset={tileset}
            resourceSet={resourceSet}
            researchSet={researchSet}
            unitSet={unitSet}
            buildingSet={buildingSet}
        >
            <GameView />
        </GameProvider>
    );
};

export default Game;