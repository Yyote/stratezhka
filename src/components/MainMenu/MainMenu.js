import React, { useRef, useContext } from 'react';
import { TilesetContext } from '../../context/TilesetContext';
import JSZip from 'jszip';
import './MainMenu.css';

const MainMenu = ({ onStartGame, setMode }) => {
  const fileInputRef = useRef(null);
  const tilesetInputRef = useRef(null);
  const { loadTilesetFromZip, isLoading } = useContext(TilesetContext);

  const handleNewGameFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // 1. Load the main .szmap archive
      const zip = await JSZip.loadAsync(file);

      // 2. Extract and load the tileset
      const tilesetFile = zip.file("tileset.szts");
      if (!tilesetFile) throw new Error("tileset.szts not found in map file.");
      const tilesetBlob = await tilesetFile.async("blob");
      await loadTilesetFromZip(tilesetBlob); // This is async!

      // 3. Extract and parse the map data
      const mapFile = zip.file("map.json");
      if (!mapFile) throw new Error("map.json not found in map file.");
      const mapContent = await mapFile.async("string");
      const loadedMapData = JSON.parse(mapContent);

      // 4. Start the game
      onStartGame(loadedMapData);

    } catch (error) {
      alert(`Error loading map file: ${error.message}`);
      console.error(error);
    }
    
    event.target.value = null;
  };
  
  const handleTilesetFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.szts')) {
      loadTilesetFromZip(file);
    } else {
      alert("Please select a valid .szts tileset file.");
    }
    event.target.value = null;
  };

  return (
    <div className="main-menu-container">
      <h1 className="game-title">Stratezhka</h1>
      <div className="menu-buttons">
        <input type="file" ref={fileInputRef} onChange={handleNewGameFileChange} style={{ display: 'none' }} accept=".szmap" />
        <input type="file" ref={tilesetInputRef} onChange={handleTilesetFileChange} style={{ display: 'none' }} accept=".szts" />
        
        <button onClick={() => fileInputRef.current.click()}>New Game</button>
        <button disabled title="Work in progress">Load Game</button>
        <button onClick={() => setMode('editor')}>Create a Map</button>
        <button onClick={() => setMode('tileset_creator')}>Tileset Creator</button>
        <button onClick={() => tilesetInputRef.current.click()} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Import Tileset (.szts)'}
        </button>
      </div>
    </div>
  );
};

export default MainMenu;
