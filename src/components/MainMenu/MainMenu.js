import React, { useRef, useContext } from 'react';
import { TilesetContext } from '../../context/TilesetContext';
import { ResourceSetContext } from '../../context/ResourceSetContext';
import JSZip from 'jszip';
import './MainMenu.css';

const MainMenu = ({ onStartHotseat, onStartGameWithMap, setMode, isAwaitingMap }) => {
  const mapInputRef = useRef(null);
  const tilesetInputRef = useRef(null);
  const resourceSetInputRef = useRef(null); // Correctly defined here

  const { tileset, loadTilesetFromZip } = useContext(TilesetContext);
  const { resourceSet, loadResourceSetFromZip } = useContext(ResourceSetContext);

  const handleMapFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const zip = await JSZip.loadAsync(file);
      const tilesetFile = zip.file("tileset.szts");
      if (!tilesetFile) throw new Error("tileset.szts not found in map file.");
      const tilesetBlob = await tilesetFile.async("blob");
      await loadTilesetFromZip(tilesetBlob);

      const mapFile = zip.file("map.json");
      if (!mapFile) throw new Error("map.json not found in map file.");
      const mapContent = await mapFile.async("string");
      const loadedMapData = JSON.parse(mapContent);
      
      onStartGameWithMap(loadedMapData);
    } catch (error) {
      alert(`Error loading map file: ${error.message}`);
    }
    event.target.value = null;
  };
  
  const handleTilesetFileChange = (event) => {
    const file = event.target.files[0];
    if (file) loadTilesetFromZip(file);
    event.target.value = null;
  };

  const handleResourceSetFileChange = (event) => {
    const file = event.target.files[0];
    if (file) loadResourceSetFromZip(file);
    event.target.value = null;
  };

  return (
    <div className="main-menu-container">
      <h1 className="game-title">{isAwaitingMap ? "Select Map" : "Stratezhka"}</h1>
      {isAwaitingMap && <p className="subtitle">Choose a map to begin your hotseat game.</p>}
      {!isAwaitingMap && (
        <div className="current-sets-indicator">
          <h3>Currently Loaded Sets</h3>
          <div className="set-info"><span>Tileset:</span><strong>{tileset?.name || 'N/A'}</strong></div>
          <div className="set-info"><span>Resource Set:</span><strong>{resourceSet?.name || 'None'}</strong></div>
          <div className="set-info-disabled"><span>Research Set:</span><strong>Not Loaded</strong></div>
        </div>
      )}
      <div className="menu-buttons">
        <input type="file" ref={mapInputRef} onChange={handleMapFileChange} style={{ display: 'none' }} accept=".szmap" />
        <input type="file" ref={tilesetInputRef} onChange={handleTilesetFileChange} style={{ display: 'none' }} accept=".szts" />
        <input type="file" ref={resourceSetInputRef} onChange={handleResourceSetFileChange} style={{ display: 'none' }} accept=".szrs" />
        {isAwaitingMap ? (
            <button onClick={() => mapInputRef.current.click()}>Load Map File (.szmap)</button>
        ) : (
            <>
                <button onClick={onStartHotseat}>Hotseat Game</button>
                <button disabled title="Coming Soon!">Online Game</button>
                <hr/>
                <button onClick={() => setMode('editor')}>Map Editor</button>
                <button onClick={() => setMode('tileset_creator')}>Tileset Editor</button>
                <button onClick={() => setMode('resource_creator')}>Resource Editor</button>
                <button onClick={() => setMode('research_creator')}>Research Editor</button>
                <hr/>
                <button onClick={() => tilesetInputRef.current.click()}>Import Tileset (.szts)</button>
                {/* ====================================================== */}
                {/* THE FIX: Corrected the variable name to camelCase      */}
                {/* ====================================================== */}
                <button onClick={() => resourceSetInputRef.current.click()}>Import Resource Set (.szrs)</button>
            </>
        )}
      </div>
    </div>
  );
};

export default MainMenu;