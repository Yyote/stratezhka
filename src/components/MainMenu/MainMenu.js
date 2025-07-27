import React, { useRef } from 'react';
// Import the UTILITY functions, not the context itself for loading
import { loadTilesetFromZip } from '../../context/TilesetContext';
import JSZip from 'jszip';
import './MainMenu.css';

const MainMenu = ({ onStartGame, setMode, setTileset }) => {
  const mapInputRef = useRef(null);
  const tilesetInputRef = useRef(null);

  const handleNewGameFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // 1. Load the main .szmap archive
      const zip = await JSZip.loadAsync(file);

      // 2. Extract tileset and load it using the utility function
      const tilesetFile = zip.file("tileset.szts");
      if (!tilesetFile) throw new Error("tileset.szts not found in map file.");
      const tilesetBlob = await tilesetFile.async("blob");
      const loadedTileset = await loadTilesetFromZip(tilesetBlob);

      // 3. Extract and parse map data
      const mapFile = zip.file("map.json");
      if (!mapFile) throw new Error("map.json not found in map file.");
      const mapContent = await mapFile.async("string");
      const loadedMapData = JSON.parse(mapContent);

      // 4. Pass BOTH pieces of data up to App.js to start the game
      onStartGame(loadedMapData, loadedTileset);

    } catch (error) {
      alert(`Error loading map file: ${error.message}`);
      console.error(error);
    }
    
    event.target.value = null;
  };
  
  const handleTilesetFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.szts')) {
      try {
        const newTileset = await loadTilesetFromZip(file);
        // Directly update the App's state via the passed-down function
        setTileset(newTileset);
      } catch (error) {
        // Error is already alerted in the utility function
        console.error(error);
      }
    } else {
      alert("Please select a valid .szts tileset file.");
    }
    event.target.value = null;
  };

  return (
    <div className="main-menu-container">
      <h1 className="game-title">Stratezhka</h1>
      <div className="menu-buttons">
        <input type="file" ref={mapInputRef} onChange={handleNewGameFileChange} style={{ display: 'none' }} accept=".szmap" />
        <input type="file" ref={tilesetInputRef} onChange={handleTilesetFileChange} style={{ display: 'none' }} accept=".szts" />
        
        <button onClick={() => mapInputRef.current.click()}>New Game</button>
        <button disabled title="Work in progress">Load Game</button>
        <button onClick={() => setMode('editor')}>Create a Map</button>
        <button onClick={() => setMode('tileset_creator')}>Tileset Creator</button>
        <button onClick={() => tilesetInputRef.current.click()}>
          Import Tileset (.szts)
        </button>
      </div>
    </div>
  );
};

export default MainMenu;
