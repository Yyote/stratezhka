import React, { useRef, useContext } from 'react';
import { TilesetContext } from '../../context/TilesetContext';
import { ResourceSetContext } from '../../context/ResourceSetContext';
import { ResearchSetContext } from '../../context/ResearchSetContext';
import { UnitsetContext } from '../../context/UnitsetContext';
import { BuildingsetContext } from '../../context/BuildingsetContext';
import JSZip from 'jszip';
import './MainMenu.css';

const MainMenu = ({ onStartHotseat, onStartGameWithMap, setMode, isAwaitingMap, onResourceSetLoaded }) => {
  const mapInputRef = useRef(null);
  const tilesetInputRef = useRef(null);
  const resourceSetInputRef = useRef(null);
  const researchSetInputRef = useRef(null);
  const unitSetInputRef = useRef(null);
  const buildingSetInputRef = useRef(null);

  const { tileset, loadTilesetFromZip } = useContext(TilesetContext);
  const { resourceSet, loadResourceSetFromZip } = useContext(ResourceSetContext);
  const { researchSet, loadResearchSetFromZip } = useContext(ResearchSetContext);
  const { unitSet, loadUnitsetFromZip } = useContext(UnitsetContext);
  const { buildingSet, loadBuildingsetFromZip } = useContext(BuildingsetContext);

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

  const handleResourceSetFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
        const loadedSet = await loadResourceSetFromZip(file);
        if (loadedSet) {
            onResourceSetLoaded(loadedSet); // Pass the complete data up to App.js
        }
    }
    event.target.value = null;
  };

  const handleUnitsetFileChange = (event) => {
    const file = event.target.files[0];
    if (file) loadUnitsetFromZip(file);
    event.target.value = null;
  };

  const handleBuildingsetFileChange = (event) => {
    const file = event.target.files[0];
    if (file) loadBuildingsetFromZip(file);
    event.target.value = null;
  };

  const handleResearchSetFileChange = (event) => {
    const file = event.target.files[0];
    if (file) loadResearchSetFromZip(file);
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
          <div className="set-info"><span>Research Set:</span><strong>{researchSet?.name || 'None'}</strong></div>
          <div className="set-info"><span>Unit Set:</span><strong>{unitSet?.name || 'None'}</strong></div>
          <div className="set-info"><span>Building Set:</span><strong>{buildingSet?.name || 'None'}</strong></div>
        </div>
      )}
      <div className="menu-buttons">
        <input type="file" ref={mapInputRef} onChange={handleMapFileChange} style={{ display: 'none' }} accept=".szmap" />
        <input type="file" ref={tilesetInputRef} onChange={handleTilesetFileChange} style={{ display: 'none' }} accept=".szts" />
        <input type="file" ref={resourceSetInputRef} onChange={handleResourceSetFileChange} style={{ display: 'none' }} accept=".szrs" />
        <input type="file" ref={researchSetInputRef} onChange={handleResearchSetFileChange} style={{ display: 'none' }} accept=".szrsh" />
        <input type="file" ref={unitSetInputRef} onChange={handleUnitsetFileChange} style={{ display: 'none' }} accept=".szus" />
        <input type="file" ref={buildingSetInputRef} onChange={handleBuildingsetFileChange} style={{ display: 'none' }} accept=".szbs" />
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
                <button onClick={() => setMode('unitset_creator')}>Unitset Editor</button>
                <button onClick={() => setMode('buildingset_creator')}>Building Editor</button>
                <button onClick={() => setMode('research_creator')}>Research Editor</button>
                <hr/>
                <button onClick={() => tilesetInputRef.current.click()}>Import Tileset (.szts)</button>
                <button onClick={() => resourceSetInputRef.current.click()}>Import Resource Set (.szrs)</button>
                <button onClick={() => researchSetInputRef.current.click()}>Import Research Set (.szrsh)</button>
                <button onClick={() => unitSetInputRef.current.click()}>Import Unit Set (.szus)</button>
                <button onClick={() => buildingSetInputRef.current.click()}>Import Building Set (.szbs)</button>
            </>
        )}
      </div>
    </div>
  );
};

export default MainMenu;