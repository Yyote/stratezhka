import React from 'react';
import './PlayerUI.css';

const PlayerUI = ({ players, currentPlayerId, onFinishTurn, onSwitchPlayer }) => {
  const currentPlayer = players.find(p => p.id === currentPlayerId);

  // Determine if the current player's turn is finished to disable the buttons
  const isTurnFinished = currentPlayer?.isTurnFinished || false;

  return (
    <div className="player-ui-container" style={{ borderTop: `2px solid ${currentPlayer?.color}` }}>
      <div className="player-info">
        <h3>Current Player: <span style={{ color: currentPlayer?.color, textShadow: `0 0 5px ${currentPlayer?.color}` }}>{currentPlayer?.name}</span></h3>
      </div>
      <div className="player-actions">
        {/* The Switch Player button should be disabled once a player finishes their turn */}
        <button onClick={onSwitchPlayer} disabled={isTurnFinished}>Switch Player</button>
        <button 
            onClick={onFinishTurn} 
            className="finish-turn-btn"
            disabled={isTurnFinished} // Disable the button after clicking
        >
          {isTurnFinished ? 'Waiting for others...' : 'Finish Turn'}
        </button>
      </div>
    </div>
  );
};

export default PlayerUI;
