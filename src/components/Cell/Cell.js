import React, { useMemo } from 'react';
import './Cell.css';

const Cell = ({ id, texture, entities, players, onClick }) => {
  const presentPlayerIds = useMemo(() => {
    const ids = new Set();
    if (entities) {
      entities.units.forEach(u => ids.add(u.playerId));
      // In case a city is present but no units
      entities.cities.forEach(c => ids.add(c.playerId));
    }
    return Array.from(ids);
  }, [entities]);

  const getPlayerColor = (id) => players.find(p => p.id === id)?.color || 'grey';

  return (
    <div id={id} className="cell" style={{ backgroundImage: `url(${texture})` }} onClick={onClick}>
      {/* Render City as a big circle */}
      {entities?.cities[0] && (
        <div className="city-marker" style={{ backgroundColor: getPlayerColor(entities.cities[0].playerId) }}></div>
      )}
      
      {/* Render Flags for each player with units */}
      <div className="flag-container">
        {presentPlayerIds.map(playerId => (
            <div key={playerId} className="player-flag" style={{ '--player-color': getPlayerColor(playerId) }}></div>
        ))}
      </div>
    </div>
  );
};

export default Cell;
