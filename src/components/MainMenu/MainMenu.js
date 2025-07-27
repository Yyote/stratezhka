import React, { useRef } from 'react';
import './MainMenu.css';

const MainMenu = ({ onStartGame, onCreateMap }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.map.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const mapData = JSON.parse(e.target.result);
          onStartGame(mapData); // Pass map data up to App.js
        } catch (error) {
          alert('Error: Invalid map file format.');
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid .map.json file.');
    }
  };

  const handleNewGameClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="main-menu-container">
      <h1 className="game-title">Stratezhka</h1>
      <div className="menu-buttons">
        {/* Hidden file input, triggered by the button */}
        <input
          type="file"
          accept=".map.json"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button onClick={handleNewGameClick}>New Game</button>
        <button disabled title="Work in progress">Load Game</button>
        <button onClick={onCreateMap}>Create a Map</button>
      </div>
    </div>
  );
};

export default MainMenu;
