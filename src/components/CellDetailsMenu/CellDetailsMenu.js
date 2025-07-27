import React from 'react';
import './CellDetailsMenu.css';

const CellDetailsMenu = ({ cellData, players, onSelectUnit, onClose }) => {
  if (!cellData) return null;

  const getPlayer = (id) => players.find(p => p.id === id);

  const unitsByPlayer = cellData.units.reduce((acc, unit) => {
    acc[unit.playerId] = (acc[unit.playerId] || 0) + 1;
    return acc;
  }, {});
  
  return (
    <div className="cell-details-menu">
      <button className="close-btn" onClick={onClose}>×</button>
      <h3>Cell ({cellData.row}, {cellData.col})</h3>
      <div className="details-section">
        <h4>Units</h4>
        {Object.keys(unitsByPlayer).length > 0 ? (
          <ul>
            {Object.entries(unitsByPlayer).map(([playerId, count]) => (
              <li key={playerId} onClick={() => onSelectUnit(cellData.units.find(u => u.playerId == playerId))}>
                <span className="player-color-dot" style={{ backgroundColor: getPlayer(playerId)?.color }}></span>
                {getPlayer(playerId)?.name}: {count} unit(s)
              </li>
            ))}
          </ul>
        ) : <p>None</p>}
      </div>
      <div className="details-section">
          <h4>City</h4>
          {cellData.city ? (
              <p><span className="player-color-dot" style={{ backgroundColor: getPlayer(cellData.city.playerId)?.color }}></span>{getPlayer(cellData.city.playerId)?.name}</p>
          ) : <p>None</p>}
      </div>
    </div>
  );
};

export default CellDetailsMenu;
