import React, { useRef } from 'react';
import { loadTilesetFromZip } from '../../context/TilesetContext';
import JSZip from 'jszip';
import './MainMenu.css';

const MainMenu = ({ onStartHotseat, onStartGameWithMap, setMode, setTileset, isAwaitingMap }) => {
  const mapInputRef = useRef(null);
  const tilesetInputRef = useRef(null);

  const handleMapFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const zip = await JSZip.loadAsync(file);
      const tilesetFile = zip.file("tileset.szts");
      if (!tilesetFile) throw new Error("tileset.szts not found in map file.");
      const tilesetBlob = await tilesetFile.async("blob");
      const loadedTileset = await loadTilesetFromZip(tilesetBlob);

      const mapFile = zip.file("map.json");
      if (!mapFile) throw new Error("map.json not found in map file.");
      const mapContent = await mapFile.async("string");
      const loadedMapData = JSON.parse(mapContent);

      onStartGameWithMap(loadedMapData, loadedTileset);

    } catch (error) {
      alert(`Error loading map file: ${error.message}`);
    }
    
    event.target.value = null;
  };
  
  const handleTilesetFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.name.endsWith('.szts')) {
      try {
        const newTileset = await loadTilesetFromZip(file);
        setTileset(newTileset);
      } catch (error) {
        console.error(error);
      }
    } else {
      alert("Please select a valid .szts tileset file.");
    }
    event.target.value = null;
  };

  return (
    <div className="main-menu-container">
      {/* THE FIX: Show a different title and prompt if waiting for a map */}
      <h1 className="game-title">{isAwaitingMap ? "Select Map" : "Stratezhka"}</h1>
      {isAwaitingMap && <p className="subtitle">Choose a map to begin your hotseat game.</p>}
      
      <div className="menu-buttons">
        <input type="file" ref={mapInputRef} onChange={handleMapFileChange} style={{ display: 'none' }} accept=".szmap" />
        <input type="file" ref={tilesetInputRef} onChange={handleTilesetFileChange} style={{ display: 'none' }} accept=".szts" />
        
        {/* THE FIX: Conditionally render the buttons based on the game state */}
        {isAwaitingMap ? (
            <button onClick={() => mapInputRef.current.click()}>Load Map File (.szmap)</button>
        ) : (
            <>
                <button onClick={onStartHotseat}>Hotseat Game</button>
                <button disabled title="Coming Soon!">Online Game</button>
                <hr/>
                <button onClick={() => setMode('editor')}>Create a Map</button>
                <button onClick={() => setMode('tileset_creator')}>Tileset Creator</button>
                <button onClick={() => setMode('resource_creator')}>Resource Editor</button> {/* <-- NEW */}

                <button onClick={() => tilesetInputRef.current.click()}>
                Import Tileset (.szts)
                </button>
            </>
        )}
      </div>
    </div>
  );
};

export default MainMenu;
