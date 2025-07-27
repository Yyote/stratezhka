import React, { useState, useMemo, useRef, useContext, useEffect } from 'react';
import { TilesetContext } from '../../context/TilesetContext';
import GameGrid from '../GameGrid/GameGrid';
import MapDisplay from '../MapDisplay/MapDisplay';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import './MapEditor.css';

const MapEditor = ({ onReturnToMenu }) => {
  const { tileset } = useContext(TilesetContext);
  const mapDisplayRef = useRef(null);

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
    setMapData({
      name: mapName,
      width: gridSize.width,
      height: gridSize.height,
      grid: newGrid,
    });
  };

  const handleTilePaint = (rowIndex, colIndex) => {
    if (!mapData) return;
    const newGrid = mapData.grid.map(row => [...row]);
    newGrid[rowIndex][colIndex] = selectedTile;
    setMapData(prev => ({ ...prev, grid: newGrid }));
  };

  const handleExportMap = async () => {
    if (!mapData) {
      alert('Please create a grid first.');
      return;
    }
    if (!tileset || tileset.tiles.length === 0) {
      alert('Cannot export map: The current tileset is invalid.');
      return;
    }

    // --- 1. Create the tileset.szts archive in memory ---
    const tilesetZip = new JSZip();
    const tsAssets = tilesetZip.folder("assets").folder("textures");
    
    const manifestTiles = tileset.tiles.map(tile => {
      if (tile.textureBlob) {
        tsAssets.file(tile.texture_path, tile.textureBlob);
      }
      const { textureUrl, textureBlob, ...manifestTile } = tile;
      return manifestTile;
    });

    const tilesetManifest = { name: tileset.name, tiles: manifestTiles };
    tilesetZip.file("manifest.json", JSON.stringify(tilesetManifest, null, 2));
    const tilesetBlob = await tilesetZip.generateAsync({ type: "blob" });

    // --- 2. Create the final map.szmap archive ---
    const mapZip = new JSZip();
    
    const mapObject = {
      name: mapName,
      width: gridSize.width,
      height: gridSize.height,
      grid: mapData.grid,
    };
    mapZip.file("map.json", JSON.stringify(mapObject, null, 2));
    mapZip.file("tileset.szts", tilesetBlob);

    // --- 3. Trigger the download ---
    const mapZipBlob = await mapZip.generateAsync({ type: "blob" });
    saveAs(mapZipBlob, `${mapName || 'untitled'}.szmap`);
  };

  const handleCenterView = () => {
    mapDisplayRef.current?.centerView(1);
  };

  const textureGrid = useMemo(() => {
    if (!mapData || !tileset) return null;
    const tileMap = new Map(tileset.tiles.map(t => [t.type_name, t]));
    return mapData.grid.map(row =>
      row.map(tileTypeName => ({ texture: tileMap.get(tileTypeName)?.textureUrl || null }))
    );
  }, [mapData, tileset]);

  return (
    <div className="map-editor-container">
      <div className="editor-controls">
        <h2>Map Editor</h2>
        <div className="control-group">
          <label>Width:</label>
          <input type="number" min="5" max="100" value={gridSize.width} onChange={(e) => setGridSize(s => ({ ...s, width: parseInt(e.target.value) }))}/>
        </div>
        <div className="control-group">
          <label>Height:</label>
          <input type="number" min="5" max="100" value={gridSize.height} onChange={(e) => setGridSize(s => ({ ...s, height: parseInt(e.target.value) }))}/>
        </div>
        <button onClick={handleCreateGrid}>Create/Resize Grid</button>
        <button onClick={handleCenterView}>Center View</button>
        <hr />
        <h4>Tile Palette</h4>
        <div className="palette">
          {tileset?.tiles.map((tile) => (
            <div
              key={tile.type_name}
              className={`palette-tile ${selectedTile === tile.type_name ? 'selected' : ''}`}
              onClick={() => setSelectedTile(tile.type_name)}
            >
              <img src={tile.textureUrl} alt={tile.type_name} />
              <span>{tile.type_name}</span>
            </div>
          ))}
        </div>
        <hr />
        <div className="control-group">
          <label>Map Name:</label>
          <input type="text" value={mapName} onChange={(e) => setMapName(e.target.value)} />
        </div>
        <button onClick={handleExportMap}>Export Map (.szmap)</button>
        <button className="return-button" onClick={onReturnToMenu}>Return to Main Menu</button>
      </div>
      <div className="editor-grid-area">
        {textureGrid ? (
          <MapDisplay ref={mapDisplayRef}>
            <GameGrid
              gridData={textureGrid}
              onCellClick={handleTilePaint}
              editorMode={true}
            />
          </MapDisplay>
        ) : (
          <div className="placeholder-text">Create a grid to start editing</div>
        )}
      </div>
    </div>
  );
};

export default MapEditor;
