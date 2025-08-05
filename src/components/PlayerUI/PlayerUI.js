import React, { useMemo } from 'react';
import './PlayerUI.css';

const PlayerUI = ({ players, currentPlayerId, resourceSet, buildingSet, onFinishTurn, onSwitchPlayer, onInitiatePlacement }) => {
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isTurnFinished = currentPlayer?.isTurnFinished || false;

  const resourceMap = useMemo(() => {
      if (!resourceSet) return new Map();
      return new Map(resourceSet.resources.map(r => [r.TypeId, r]));
  }, [resourceSet]);
  
  const completedResearchSet = useMemo(() => new Set(currentPlayer?.completedResearch), [currentPlayer]);

  const canAffordAndResearch = (building) => {
    if (!building.requiresResearch || building.requiresResearch.length === 0) return true;
    return building.requiresResearch.every(reqId => completedResearchSet.has(reqId));
  };

  const playerResources = currentPlayer?.resources || {};

  return (
    <div className="player-ui-container" style={{ borderTop: `2px solid ${currentPlayer?.color}` }}>
      <div className="player-info">
        <h3>Current Player: <span style={{ color: currentPlayer?.color }}>{currentPlayer?.name}</span></h3>
      </div>
      
      <div className="player-resources">
        {Object.entries(playerResources).map(([typeId, amount]) => {
            const resource = resourceMap.get(typeId);
            if (!resource) return null;
            return (
                <div key={typeId} className="resource-display" title={`${resource.name}: ${amount}`}>
                    <img src={resource.textureUrl} alt={resource.name} />
                    <span>{amount}</span>
                </div>
            );
        })}
      </div>

      <div className="build-menu">
          <span>Build:</span>
          {buildingSet?.buildings.map(building => {
              const canBuild = canAffordAndResearch(building);
              return (
                  <button key={building.TypeId} onClick={() => onInitiatePlacement(building.TypeId)} disabled={!canBuild} title={building.name}>
                      {building.name}
                  </button>
              );
          })}
      </div>

      <div className="player-actions">
        <button onClick={onSwitchPlayer} disabled={isTurnFinished}>Switch Player</button>
        <button 
            onClick={onFinishTurn} 
            className="finish-turn-btn"
            disabled={isTurnFinished}
        >
          {isTurnFinished ? 'Waiting for others...' : 'Finish Turn'}
        </button>
      </div>
    </div>
  );
};

export default PlayerUI;