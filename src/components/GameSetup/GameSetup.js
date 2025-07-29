import React, { useState, useEffect } from 'react';
import './GameSetup.css';

const GameSetup = ({ onStartGame }) => {
  const [playerCount, setPlayerCount] = useState(2);
  // State to hold player objects with id and name
  const [players, setPlayers] = useState([]);

  // This effect synchronizes the 'players' array with the 'playerCount'
  useEffect(() => {
    setPlayers(currentPlayers => {
      const newPlayers = [];
      for (let i = 0; i < playerCount; i++) {
        // Keep existing name if player already exists, otherwise create a new one
        newPlayers.push(currentPlayers[i] || { id: i, name: `Player ${i + 1}` });
      }
      return newPlayers;
    });
  }, [playerCount]);

  const handleNameChange = (id, newName) => {
    setPlayers(currentPlayers => 
      currentPlayers.map(p => (p.id === id ? { ...p, name: newName } : p))
    );
  };

  const handleStart = () => {
    // Validate that no names are empty
    if (players.some(p => p.name.trim() === '')) {
      alert("Please ensure all players have a name.");
      return;
    }
    if (playerCount >= 2 && playerCount <= 8) {
      // Pass the complete array of player objects up to the App component
      onStartGame(players);
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
          onChange={(e) => setPlayerCount(parseInt(e.target.value, 10) || 2)}
        />
      </div>

      <div className="player-names-list">
        <h3>Player Names:</h3>
        {players.map((player) => (
          <div key={player.id} className="player-name-input">
            <label htmlFor={`player-name-${player.id}`}>Player {player.id + 1}:</label>
            <input
              id={`player-name-${player.id}`}
              type="text"
              value={player.name}
              onChange={(e) => handleNameChange(player.id, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button onClick={handleStart}>Start Game</button>
    </div>
  );
};

export default GameSetup;
