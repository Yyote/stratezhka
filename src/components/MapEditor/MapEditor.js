import React, { useState, useRef, useContext, useEffect } from 'react';
import { TilesetContext } from '../../context/TilesetContext';
import GameGrid from '../GameGrid/GameGrid';
import MapDisplay from '../MapDisplay/MapDisplay';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import './MapEditor.css';

let renderCount = 0;

const MapEditor = ({ onReturnToMenu }) => {
  const { tileset, loadTilesetFromZip } = useContext(TilesetContext);
  const mapDisplayRef = useRef(null);
  const importInputRef = useRef(null);

  const [mapName, setMapName] = useState('my_custom_map');
  const [gridSize, setGridSize] = useState({ width: 10, height: 10 });
  const [mapData, setMapData] = useState(null);
  const [selectedTile, setSelectedTile] = useState('');
  const [textureGrid, setTextureGrid] = useState(null);

  // --- DEBUG LOG: Log state on every render ---
  renderCount++;
  console.log(`%c[MapEditor] Render #${renderCount}`, 'color: green; font-weight: bold;');
  console.log({
    mapName,
    gridSize: { ...gridSize },
    mapData: mapData ? `Array(${mapData.length})` : null,
    tileset: tileset ? tileset.name : null,
    textureGrid: textureGrid ? `Visual Grid (${textureGrid.length} rows)` : null,
  });


  useEffect(() => {
    if (tileset?.tiles.length > 0) {
      const isSelectedTileValid = tileset.tiles.some(t => t.type_name === selectedTile);
      if (!isSelectedTileValid) {
        setSelectedTile(tileset.tiles[0].type_name);
      }
    }
  }, [tileset, selectedTile]);

  const buildTextureGrid = (grid, currentTileset) => {
    console.log('%c[MapEditor] buildTextureGrid called.', 'color: orange;');
    if (!grid || !currentTileset) {
        console.warn('%c[MapEditor] buildTextureGrid returning NULL because grid or tileset is missing.', 'color: red;');
        return null;
    }
    const tileMap = new Map(currentTileset.tiles.map(t => [t.type_name, t]));
    const newGrid = grid.map(row =>
      row.map(tileTypeName => ({ texture: tileMap.get(tileTypeName)?.textureUrl || null }))
    );
    console.log('%c[MapEditor] buildTextureGrid successfully built visual grid.', 'color: orange;');
    return newGrid;
  };

  const handleCreateGrid = () => {
    const defaultTile = tileset?.tiles[0]?.type_name;
    if (!defaultTile) { alert("Cannot create a map: The current tileset has no tiles."); return; }
    const newGrid = Array.from({ length: parseInt(gridSize.height) }, () => Array.from({ length: parseInt(gridSize.width) }, () => defaultTile) );
    setMapData(newGrid);
    setTextureGrid(buildTextureGrid(newGrid, tileset));
  };

  const handleTilePaint = (rowIndex, colIndex) => {
    if (!mapData) return;
    const newGrid = mapData.map(row => [...row]);
    newGrid[rowIndex][colIndex] = selectedTile;
    setMapData(newGrid);
    setTextureGrid(buildTextureGrid(newGrid, tileset));
  };

  const handleExportMap = async () => {
    if (!mapData) { alert('Please create a grid first.'); return; }
    if (!tileset || tileset.tiles.length === 0) { alert('Cannot export map: The current tileset is invalid.'); return; }
    const tilesetZip = new JSZip();
    const tsAssets = tilesetZip.folder("assets").folder("textures");
    const manifestTiles = tileset.tiles.map(tile => {
      if (tile.textureBlob) { tsAssets.file(tile.texture_path, tile.textureBlob); }
      const { textureUrl, textureBlob, ...manifestTile } = tile;
      return manifestTile;
    });
    const tilesetManifest = { name: tileset.name, tiles: manifestTiles };
    tilesetZip.file("manifest.json", JSON.stringify(tilesetManifest, null, 2));
    const tilesetBlob = await tilesetZip.generateAsync({ type: "blob" });
    const mapZip = new JSZip();
    const mapObject = { name: mapName, width: parseInt(gridSize.width), height: parseInt(gridSize.height), grid: mapData };
    mapZip.file("map.json", JSON.stringify(mapObject, null, 2));
    mapZip.file("tileset.szts", tilesetBlob);
    const mapZipBlob = await mapZip.generateAsync({ type: "blob" });
    saveAs(mapZipBlob, `${mapName || 'untitled'}.szmap`);
  };
  
  const handleImportMap = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('%c[MapEditor] --- handleImportMap START ---', 'color: blue; font-weight: bold;');
    
    try {
        const zip = await JSZip.loadAsync(file);
        console.log('%c[MapEditor] Main .szmap ZIP loaded.', 'color: blue;');

        // Step 1: Load tileset data
        const tilesetFile = zip.file("tileset.szts");
        if (!tilesetFile) throw new Error("tileset.szts not found in map file.");
        const tilesetBlob = await tilesetFile.async("blob");
        console.log('%c[MapEditor] Calling loadTilesetFromZip...', 'color: blue;');
        const loadedTileset = await loadTilesetFromZip(tilesetBlob);
        if (!loadedTileset) throw new Error("loadTilesetFromZip returned null or undefined.");
        console.log('%c[MapEditor] Got back loadedTileset object:', 'color: blue;', loadedTileset);

        // Step 2: Load map data
        const mapFile = zip.file("map.json");
        if (!mapFile) throw new Error("map.json not found in map file.");
        const loadedMapData = JSON.parse(await mapFile.async("string"));
        console.log('%c[MapEditor] Got back loadedMapData object:', 'color: blue;', loadedMapData);
        
        // Step 3: Synchronously build the visual grid
        console.log('%c[MapEditor] Manually building texture grid before setting state...', 'color: blue;');
        const newTextureGrid = buildTextureGrid(loadedMapData.grid, loadedTileset);
        if (!newTextureGrid) throw new Error("buildTextureGrid returned null. Check data consistency.");
        
        // Step 4: Perform a single, atomic state update.
        console.log('%c[MapEditor] *** Setting all state now... ***', 'color: blue; font-weight: bold;');
        setMapName(loadedMapData.name);
        setGridSize({ width: loadedMapData.width, height: loadedMapData.height });
        setMapData(loadedMapData.grid);
        setTextureGrid(newTextureGrid);

    } catch (error) {
        console.error('%c[MapEditor] ERROR in handleImportMap:', 'color: red; font-weight: bold;', error);
        alert("Failed to import map: " + error.message);
        setMapData(null);
        setTextureGrid(null);
    }
    event.target.value = null;
    console.log('%c[MapEditor] --- handleImportMap END ---', 'color: blue; font-weight: bold;');
  };

  const handleCenterView = () => { mapDisplayRef.current?.centerView(1); };

  return (
    <div className="creator-container">
      <div className="creator-panel">
        <h2>Map Editor</h2>
        <div className="button-group">
            <button onClick={handleCreateGrid}>New Grid</button>
            <button onClick={() => importInputRef.current.click()}>Import & Edit .szmap</button>
        </div>
        <input type="file" ref={importInputRef} onChange={handleImportMap} style={{ display: 'none' }} accept=".szmap" />
        <hr/>
        <div className="control-group"> <label>Map Name:</label> <input type="text" value={mapName} onChange={(e) => setMapName(e.target.value)} /> </div>
        <div className="control-group"> <label>Width:</label> <input type="number" min="5" max="100" value={gridSize.width} onChange={(e) => setGridSize(s => ({ ...s, width: parseInt(e.target.value) || s.width }))}/> </div>
        <div className="control-group"> <label>Height:</label> <input type="number" min="5" max="100" value={gridSize.height} onChange={(e) => setGridSize(s => ({ ...s, height: parseInt(e.target.value) || s.height }))}/> </div>
        <button onClick={handleCenterView}>Center View</button>
        <hr />
        <h4>Tile Palette (from {tileset?.name})</h4>
        <div className="palette">
          {tileset?.tiles.map((tile) => (
            <div key={tile.type_name} className={`palette-tile ${selectedTile === tile.type_name ? 'selected' : ''}`} onClick={() => setSelectedTile(tile.type_name)}>
              <img src={tile.textureUrl} alt={tile.type_name} />
              <span>{tile.type_name}</span>
            </div>
          ))}
        </div>
        <hr />
        <button onClick={handleExportMap} disabled={!mapData}>Export Map (.szmap)</button>
        <button className="return-button" onClick={onReturnToMenu}>Return to Main Menu</button>
      </div>
      <div className="editor-grid-area">
        {textureGrid ? (
          <MapDisplay ref={mapDisplayRef}>
            <GameGrid gridData={textureGrid} onCellClick={handleTilePaint} editorMode={true} />
          </MapDisplay>
        ) : (
          <div className="placeholder-text">Click "New Grid" or "Import" to begin.</div>
        )}
      </div>
    </div>
  );
};

export default MapEditor;