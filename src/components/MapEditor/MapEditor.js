import React, { useState, useRef, useContext, useEffect } from 'react';
import { TilesetContext } from '../../context/TilesetContext';
import { ResourceSetContext } from '../../context/ResourceSetContext';
import GameGrid from '../GameGrid/GameGrid';
import MapDisplay from '../MapDisplay/MapDisplay';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import './MapEditor.css';

const MapEditor = ({ onReturnToMenu }) => {
  const { tileset, loadTilesetFromZip } = useContext(TilesetContext);
  const { resourceSet } = useContext(ResourceSetContext);
  const mapDisplayRef = useRef(null);
  const importInputRef = useRef(null);

  const [mapData, setMapData] = useState(null);
  const [selectedTile, setSelectedTile] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  
  // THE FIX: Restore the gridSize state
  const [gridSize, setGridSize] = useState({ width: 20, height: 15 });

  useEffect(() => {
    if (tileset?.tiles.length > 0 && !selectedTile) {
      setSelectedTile(tileset.tiles[0].type_name);
    }
  }, [tileset, selectedTile]);

  const handleCreateGrid = () => {
    const defaultTile = tileset?.tiles[0]?.type_name;
    if (!defaultTile) {
      alert("Cannot create a map: The current tileset has no tiles.");
      return;
    }
    
    // THE FIX: Use the gridSize from the state
    const width = parseInt(gridSize.width);
    const height = parseInt(gridSize.height);

    if (isNaN(width) || isNaN(height) || width < 5 || height < 5) {
        alert("Width and height must be at least 5.");
        return;
    }

    const newGrid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ({ tile: defaultTile, resources: [] }))
    );
    setMapData({
      name: 'new_custom_map',
      width: width,
      height: height,
      grid: newGrid,
    });
  };

  const handleTilePaint = (rowIndex, colIndex) => {
    if (!mapData) return;
    const newGrid = mapData.grid.map(row => row.map(cell => ({ ...cell, resources: [...cell.resources] })));
    newGrid[rowIndex][colIndex].tile = selectedTile;
    setMapData(prev => ({ ...prev, grid: newGrid }));
  };
  
  const handleResourcePaint = (event, rowIndex, colIndex) => {
    event.preventDefault();
    if (!mapData || !selectedResource) return;
    
    const newGrid = mapData.grid.map(row => row.map(cell => ({ ...cell, resources: [...cell.resources] })));
    const cellResources = newGrid[rowIndex][colIndex].resources;

    if (event.shiftKey) {
        cellResources.pop();
    } else {
        const alreadyExists = cellResources.includes(selectedResource);
        if (!alreadyExists && cellResources.length < 4) {
            cellResources.push(selectedResource);
        } else if (alreadyExists) {
            newGrid[rowIndex][colIndex].resources = cellResources.filter(res => res !== selectedResource);
        } else {
            alert("A cell can have at most 4 unique resources.");
        }
    }
    setMapData(prev => ({ ...prev, grid: newGrid }));
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
    mapZip.file("map.json", JSON.stringify(mapData, null, 2));
    mapZip.file("tileset.szts", tilesetBlob);
    const mapZipBlob = await mapZip.generateAsync({ type: "blob" });
    saveAs(mapZipBlob, `${mapData.name || 'untitled'}.szmap`);
  };
  
  const handleImportMap = async (event) => {
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
        const loadedMapData = JSON.parse(await mapFile.async("string"));
        
        // When importing, also update the gridSize state to match
        setGridSize({ width: loadedMapData.width, height: loadedMapData.height });
        setMapData(loadedMapData);

    } catch (error) {
        alert("Failed to import map: " + error.message);
    }
    event.target.value = null;
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
        {mapData && (
            <div className="control-group"> 
                <label>Map Name:</label> 
                <input type="text" value={mapData.name} onChange={(e) => setMapData(md => ({...md, name: e.target.value}))} /> 
            </div>
        )}
        
        {/* THE FIX: Restore the Width and Height input fields */}
        <div className="control-group">
            <label>Width:</label>
            <input type="number" min="5" max="100" value={gridSize.width} onChange={(e) => setGridSize(s => ({...s, width: e.target.value}))} />
        </div>
        <div className="control-group">
            <label>Height:</label>
            <input type="number" min="5" max="100" value={gridSize.height} onChange={(e) => setGridSize(s => ({...s, height: e.target.value}))} />
        </div>
        
        <button onClick={handleCenterView}>Center View</button>
        <hr />
        <h4>Tile Palette (Left-Click)</h4>
        <div className="palette">
          {tileset?.tiles.map((tile) => (
            <div key={tile.type_name} className={`palette-tile ${selectedTile === tile.type_name ? 'selected' : ''}`} onClick={() => setSelectedTile(tile.type_name)}>
              <img src={tile.textureUrl} alt={tile.type_name} />
              <span>{tile.type_name}</span>
            </div>
          ))}
        </div>

        <h4>Resource Palette (Right-Click)</h4>
        <div className="palette">
            {resourceSet?.resources.map((res) => (
                <div key={res.TypeId} className={`palette-tile ${selectedResource === res.TypeId ? 'selected' : ''}`} onClick={() => setSelectedResource(res.TypeId)}>
                    <img src={res.textureUrl} alt={res.TypeId} />
                    <span>{res.name}</span>
                </div>
            ))}
        </div>
        
        <hr />
        <button onClick={handleExportMap} disabled={!mapData}>Export Map (.szmap)</button>
        <button className="return-button" onClick={onReturnToMenu}>Return to Main Menu</button>
      </div>
      <div className="editor-grid-area">
        {mapData && tileset ? (
          <MapDisplay ref={mapDisplayRef}>
            <GameGrid
              mapData={mapData}
              tileset={tileset}
              onCellClick={handleTilePaint}
              onCellContextMenu={handleResourcePaint}
              editorMode={true}
            />
          </MapDisplay>
        ) : (
          <div className="placeholder-text">Click "New Grid" or "Import" to begin.</div>
        )}
      </div>
    </div>
  );
};

export default MapEditor;