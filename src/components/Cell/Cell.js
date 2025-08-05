import React, { useMemo, useContext } from 'react';
import { ResourceSetContext } from '../../context/ResourceSetContext';
import './Cell.css';

const Cell = ({ id, cellData, entities, players, onMouseEnter, onMouseLeave, onMouseMove, onClick, onContextMenu }) => {
  const { resourceSet } = useContext(ResourceSetContext);

  const presentPlayerIds = useMemo(() => {
    const ids = new Set();
    if (entities) {
      entities.units.forEach(u => ids.add(u.playerId));
      entities.cities.forEach(c => ids.add(c.playerId));
    }
    return Array.from(ids);
  }, [entities]);

  const getPlayerColor = (id) => players.find(p => p.id === id)?.color || 'grey';

  const getResourceTexture = (typeId) => {
    return resourceSet?.resources.find(r => r.TypeId === typeId)?.textureUrl || null;
  };

  return (
    <div
        id={id}
        className="cell"
        style={{ backgroundImage: `url(${cellData.texture})` }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onMouseMove={onMouseMove}
        onClick={onClick}
        onContextMenu={onContextMenu}
    >
      {entities?.cities[0] && (
        <div className="city-marker" style={{ backgroundColor: getPlayerColor(entities.cities[0].playerId) }}></div>
      )}
      
      <div className="flag-container">
        {presentPlayerIds.map(playerId => (
            <div key={playerId} className="player-flag" style={{ '--player-color': getPlayerColor(playerId) }}></div>
        ))}
      </div>

      {cellData.resources?.length > 0 && (
          <div className="resource-container">
              {cellData.resources.map((resTypeId, index) => (
                  <img key={index} src={getResourceTexture(resTypeId)} alt={resTypeId} className="resource-icon" />
              ))}
          </div>
      )}
    </div>
  );
};

export default Cell;