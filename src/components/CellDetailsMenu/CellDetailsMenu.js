import React, { useMemo } from 'react';
import './CellDetailsMenu.css';

const CellDetailsMenu = ({ cellData, player, players, buildingSet, resourceSet, onInitiatePlacement, onSelectUnit, onClose }) => {
  
  // THE FIX: All hooks must be called at the top level, before any conditional returns.
  const completedResearchSet = useMemo(() => new Set(player?.completedResearch), [player]);

  if (!cellData) {
    return null;
  }

  const getPlayer = (id) => players.find(p => p.id === id);

  const unitsByPlayer = (cellData.units || []).reduce((acc, unit) => {
    acc[unit.playerId] = (acc[unit.playerId] || 0) + 1;
    return acc;
  }, {});
  
  const canAfford = (building) => {
      if (!player) return false;
      return building.cost.every(c => player.resources[c.resourceTypeId] >= c.amount);
  };
  
  const hasResearch = (building) => {
      if (!building.requiresResearch || building.requiresResearch.length === 0) return true;
      return building.requiresResearch.every(reqId => completedResearchSet.has(reqId));
  };

  // This logic is now safe because the hook it depends on is always called.
  const showBuildMenu = cellData.city && cellData.city.playerId === player?.id;

  return (
    <div className="cell-details-menu">
      <button className="close-btn" onClick={onClose}>×</button>
      <div className="details-section">
        <h3>Cell ({cellData.row}, {cellData.col})</h3>
        <h4>Units</h4>
        {Object.keys(unitsByPlayer).length > 0 ? (
          <ul>
            {Object.entries(unitsByPlayer).map(([playerId, count]) => (
              <li key={playerId} onClick={() => onSelectUnit && onSelectUnit(cellData.units.find(u => u.playerId == playerId))}>
                <span className="player-color-dot" style={{ backgroundColor: getPlayer(playerId)?.color }}></span>
                {getPlayer(playerId)?.name}: {count} unit(s)
              </li>
            ))}
          </ul>
        ) : <p>None</p>}
      </div>
      <div className="details-section">
          <h4>Building</h4>
          {cellData.city ? (
              <p><span className="player-color-dot" style={{ backgroundColor: getPlayer(cellData.city.playerId)?.color }}></span>{cellData.city.name} ({getPlayer(cellData.city.playerId)?.name})</p>
          ) : <p>None</p>}
      </div>

      {showBuildMenu && (
          <div className="details-section">
              <h4>Build</h4>
              <div className="build-list">
                  {buildingSet.buildings.map(bld => {
                      if (bld.TypeId === 'city') return null;
                      const isAffordable = canAfford(bld);
                      const isResearched = hasResearch(bld);
                      const canBuild = isAffordable && isResearched;

                      return (
                          <div
                            key={bld.TypeId}
                            className={`build-item ${!canBuild ? 'disabled' : ''}`}
                            onClick={() => onInitiatePlacement(bld.TypeId, isAffordable)}
                          >
                            <img src={bld.textureUrl} alt={bld.name} className="build-item-texture"/>
                            <div className="build-item-info">
                                <strong>{bld.name}</strong>
                                <div className="build-item-cost">
                                    {bld.cost.map(c => {
                                        const playerHas = player.resources[c.resourceTypeId];
                                        const costClass = playerHas >= c.amount ? 'cost-affordable' : 'cost-unaffordable';
                                        return <span key={c.resourceTypeId} className={costClass}>{c.amount} {c.resourceTypeId}</span>
                                    })}
                                </div>
                            </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}
    </div>
  );
};

export default CellDetailsMenu;