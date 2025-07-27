import React, { useState, useMemo } from 'react';
import GameGrid from '../GameGrid/GameGrid';
import './MapEditor.css';

// Import textures to use in the palette
import grassTexture from '../../assets/textures/grass.png';
import waterTexture from '../../assets/textures/water.png';
import mountainTexture from '../../assets/textures/mountain.png';

const TILE_TYPES = {
  grass: { name: 'Grass', texture: grassTexture },
  water: { name: 'Water', texture: waterTexture },
  mountain: { name: 'Mountain', texture: mountainTexture },
};

const MapEditor = ({ onReturnToMenu }) => {
  const [gridSize, setGridSize] = useState({ width: 10, height: 10 });
  const [mapData, setMapData] = useState(null);
  const [selectedTile, setSelectedTile] = useState('grass');
  const [mapName, setMapName] = useState('my_custom_map');

  const handleCreateGrid = () => {
    const newGrid = Array.from({ length: gridSize.height }, () =>
      Array.from({ length: gridSize.width }, () => 'grass') // Default to grass
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

  const handleExportMap = () => {
    if (!mapData) {
      alert('Please create a grid first.');
      return;
    }
    const mapObject = {
      ...mapData,
      name: mapName,
    };
    const jsonString = JSON.stringify(mapObject, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mapName || 'untitled'}.map.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Convert the string grid to a texture grid for rendering
  const textureGrid = useMemo(() => {
    if (!mapData) return null;
    return mapData.grid.map(row =>
      row.map(tileType => ({ texture: TILE_TYPES[tileType]?.texture || grassTexture }))
    );
  }, [mapData]);

  return (
    <div className="map-editor-container">
      <div className="editor-controls">
        <h2>Map Editor</h2>
        <div className="control-group">
          <label>Width:</label>
          <input
            type="number"
            min="5"
            max="100"
            value={gridSize.width}
            onChange={(e) => setGridSize(s => ({ ...s, width: parseInt(e.target.value) }))}
          />
        </div>
        <div className="control-group">
          <label>Height:</label>
          <input
            type="number"
            min="5"
            max="100"
            value={gridSize.height}
            onChange={(e) => setGridSize(s => ({ ...s, height: parseInt(e.target.value) }))}
          />
        </div>
        <button onClick={handleCreateGrid}>Create/Resize Grid</button>

        <hr />

        <h4>Tile Palette</h4>
        <div className="palette">
          {Object.entries(TILE_TYPES).map(([key, { name, texture }]) => (
            <div
              key={key}
              className={`palette-tile ${selectedTile === key ? 'selected' : ''}`}
              onClick={() => setSelectedTile(key)}
            >
              <img src={texture} alt={name} />
              <span>{name}</span>
            </div>
          ))}
        </div>

        <hr />

        <div className="control-group">
          <label>Map Name:</label>
          <input
            type="text"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
          />
        </div>
        <button onClick={handleExportMap}>Export Map (.map.json)</button>
        <button className="return-button" onClick={onReturnToMenu}>Return to Main Menu</button>
      </div>

      <div className="editor-grid-area">
        {textureGrid ? (
          <GameGrid
            gridData={textureGrid}
            onCellClick={handleTilePaint}
            editorMode={true}
          />
        ) : (
          <div className="placeholder-text">Create a grid to start editing</div>
        )}
      </div>
    </div>
  );
};

export default MapEditor;
