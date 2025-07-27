import React from 'react';
import './PlayerUI.css';

const PlayerUI = ({ players, currentPlayerId, onFinishTurn, onSwitchPlayer }) => {
  const currentPlayer = players.find(p => p.id === currentPlayerId);

  return (
    <div className="player-ui-container" style={{ backgroundColor: currentPlayer?.color + '40' }}>
      <div className="player-info">
        <h3>Current Player: <span style={{ color: currentPlayer?.color }}>{currentPlayer?.name}</span></h3>
      </div>
      <div className="player-actions">
        <button onClick={onSwitchPlayer}>Switch Player</button>
        <button onClick={onFinishTurn} className="finish-turn-btn">Finish Turn</button>
      </div>
    </div>
  );
};

export default PlayerUI;
