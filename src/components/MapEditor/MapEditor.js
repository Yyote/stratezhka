import React, { useState, useMemo, useRef, useContext, useEffect } from 'react';
import { TilesetContext } from '../../context/TilesetContext';
import GameGrid from '../GameGrid/GameGrid';
import MapDisplay from '../MapDisplay/MapDisplay';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import './MapEditor.css';

const MapEditor = ({ onReturnToMenu }) => {
  // Now uses loadTilesetFromZip from the context
  const { tileset, loadTilesetFromZip } = useContext(TilesetContext);
  const mapDisplayRef = useRef(null);
  const importInputRef = useRef(null);

  const [gridSize, setGridSize] = useState({ width: 10, height: 10 });
  const [mapData, setMapData] = useState(null);
  const [selectedTile, setSelectedTile] = useState('');
  const [mapName, setMapName] = useState('my_custom_map');

  useEffect(() => {
    if (tileset && tileset.tiles.length > 0) {
      setSelectedTile(tileset.tiles[0].type_name);
    }
  }, [tileset]);

  const handleCreateGrid = () => {
    const defaultTile = tileset?.tiles[0]?.type_name;
    if (!defaultTile) {
      alert("Cannot create a map: The current tileset has no tiles.");
      return;
    }
    const newGrid = Array.from({ length: gridSize.height }, () =>
      Array.from({ length: gridSize.width }, () => defaultTile)
    );
    setMapData({ grid: newGrid });
  };

  const handleTilePaint = (rowIndex, colIndex) => {
    if (!mapData) return;
    const newGrid = mapData.grid.map(row => [...row]);
    newGrid[rowIndex][colIndex] = selectedTile;
    setMapData(prev => ({ ...prev, grid: newGrid }));
  };

  const handleExportMap = async () => {
    if (!mapData) { alert('Please create a grid first.'); return; }
    if (!tileset || tileset.tiles.length === 0) { alert('Cannot export map: The current tileset is invalid.'); return; }

    const tilesetZip = new JSZip();
    const tsAssets = tilesetZip.folder("assets").folder("textures");
    
    const manifestTiles = tileset.tiles.map(tile => {
      if (tile.textureBlob) { // Blobs are from imported sets
        tsAssets.file(tile.texture_path, tile.textureBlob);
      }
      const { textureUrl, textureBlob, ...manifestTile } = tile;
      return manifestTile;
    });
    const tilesetManifest = { name: tileset.name, tiles: manifestTiles };
    tilesetZip.file("manifest.json", JSON.stringify(tilesetManifest, null, 2));
    const tilesetBlob = await tilesetZip.generateAsync({ type: "blob" });

    const mapZip = new JSZip();
    const mapObject = { name: mapName, width: gridSize.width, height: gridSize.height, grid: mapData.grid };
    mapZip.file("map.json", JSON.stringify(mapObject, null, 2));
    mapZip.file("tileset.szts", tilesetBlob);
    const mapZipBlob = await mapZip.generateAsync({ type: "blob" });
    saveAs(mapZipBlob, `${mapName || 'untitled'}.szmap`);
  };
  
  const handleImportMap = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
        const zip = await JSZip.loadAsync(file);

        // 1. Extract and load the tileset into the global context
        const tilesetFile = zip.file("tileset.szts");
        if (!tilesetFile) throw new Error("tileset.szts not found in map file.");
        const tilesetBlob = await tilesetFile.async("blob");
        await loadTilesetFromZip(tilesetBlob);

        // 2. Extract and load the map data into the local editor state
        const mapFile = zip.file("map.json");
        if (!mapFile) throw new Error("map.json not found in map file.");
        const mapContent = await mapFile.async("string");
        const loadedMapData = JSON.parse(mapContent);
        
        setMapName(loadedMapData.name);
        setGridSize({ width: loadedMapData.width, height: loadedMapData.height });
        setMapData({ grid: loadedMapData.grid });

    } catch (error) {
        alert("Failed to import map: " + error.message);
    }
    event.target.value = null;
  };

  const handleCenterView = () => { mapDisplayRef.current?.centerView(1); };

  const textureGrid = useMemo(() => {
    if (!mapData || !tileset) return null;
    const tileMap = new Map(tileset.tiles.map(t => [t.type_name, t]));
    return mapData.grid.map(row =>
      row.map(tileTypeName => ({ texture: tileMap.get(tileTypeName)?.textureUrl || null }))
    );
  }, [mapData, tileset]);

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
        <div className="control-group"> <label>Width:</label> <input type="number" min="5" max="100" value={gridSize.width} onChange={(e) => setGridSize(s => ({ ...s, width: parseInt(e.target.value) }))}/> </div>
        <div className="control-group"> <label>Height:</label> <input type="number" min="5" max="100" value={gridSize.height} onChange={(e) => setGridSize(s => ({ ...s, height: parseInt(e.target.value) }))}/> </div>
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