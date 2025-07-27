import React, { useState } from 'react';
import './GameSetup.css';

const GameSetup = ({ onStartGame }) => {
  const [playerCount, setPlayerCount] = useState(2);

  const handleStart = () => {
    if (playerCount >= 2 && playerCount <= 8) {
      onStartGame(playerCount);
    } else {
      alert("Please enter a number of players between 2 and 8.");
    }
  };

  return (
    <div className="game-setup-container">
      <h1>Hotseat Setup</h1>
      <div className="setup-control">
        <label htmlFor="player-count">Number of Players:</label>
        <input
          id="player-count"
          type="number"
          min="2"
          max="8"
          value={playerCount}
          onChange={(e) => setPlayerCount(parseInt(e.target.value, 10))}
        />
      </div>
      <button onClick={handleStart}>Start Game</button>
    </div>
  );
};

export default GameSetup;
