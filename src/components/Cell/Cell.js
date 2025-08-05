import React, { useMemo, useContext } from 'react';
import { ResourceSetContext } from '../../context/ResourceSetContext';
import './Cell.css';

const Cell = ({ id, cellData, entities, players, onMouseEnter, onMouseLeave, onMouseMove, onClick, onContextMenu }) => {
  const { resourceSet } = useContext(ResourceSetContext);

  const getResourceTexture = (typeId) => {
    if (!resourceSet || !resourceSet.resources) {
        console.warn(`%c[Cell ${id}] ResourceSet not available yet.`, 'color: red');
        return null;
    }
    const resource = resourceSet.resources.find(r => r.TypeId === typeId);
    if (!resource) {
        console.warn(`%c[Cell ${id}] getResourceTexture: Could not find resource with TypeId "${typeId}"`, 'color: red');
        return null;
    }
    if (!resource.textureUrl) {
        console.warn(`%c[Cell ${id}] getResourceTexture: Found resource "${typeId}" but it has no textureUrl.`, 'color: red', resource);
    }
    return resource.textureUrl;
  };

  if (entities?.cities.length > 0) {
      console.log(`%c[Cell ${id}] Rendering with city for player ${entities.cities[0].playerId}`, 'color: green');
  }

  const presentPlayerIds = useMemo(() => {
    const ids = new Set();
    if (entities) {
      entities.units.forEach(u => ids.add(u.playerId));
      entities.cities.forEach(c => ids.add(c.playerId));
    }
    return Array.from(ids);
  }, [entities]);

  const getPlayerColor = (id) => players.find(p => p.id === id)?.color || 'grey';

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