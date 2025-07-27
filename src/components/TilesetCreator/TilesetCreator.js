import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import './TilesetCreator.css';

const TileEditorCard = ({ tile, onUpdate, onRemove }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "image/png") {
      const textureUrl = URL.createObjectURL(file);
      onUpdate({ ...tile, texture_path: file.name, textureFile: file, textureUrl });
    } else {
        alert("Please select a valid .png file.");
    }
  };

  return (
    <div className="tile-card">
      <div className="tile-preview">
        {tile.textureUrl ? <img src={tile.textureUrl} alt="preview" /> : "No Texture"}
      </div>
      <div className="tile-details">
        <input
          type="text"
          placeholder="type_name"
          value={tile.type_name}
          onChange={(e) => onUpdate({ ...tile, type_name: e.target.value })}
        />
        <button className="tile-card-button" onClick={() => document.getElementById(`file-${tile.id}`).click()}>
          Change Texture
        </button>
        <input type="file" id={`file-${tile.id}`} style={{ display: 'none' }} onChange={handleFileChange} accept="image/png" />
        <div className="passability-flags">
          <label><input type="checkbox" checked={tile.ground_passable} onChange={(e) => onUpdate({ ...tile, ground_passable: e.target.checked })} /> Ground</label>
          <label><input type="checkbox" checked={tile.air_passable} onChange={(e) => onUpdate({ ...tile, air_passable: e.target.checked })} /> Air</label>
          {/* ====================================================== */}
          {/* CHANGE #2: Replaced single Water checkbox with two new ones */}
          {/* ====================================================== */}
          <label><input type="checkbox" checked={tile.overwater_passable} onChange={(e) => onUpdate({ ...tile, overwater_passable: e.target.checked })} /> Overwater</label>
          <label><input type="checkbox" checked={tile.underwater_passable} onChange={(e) => onUpdate({ ...tile, underwater_passable: e.target.checked })} /> Underwater</label>
        </div>
      </div>
      <button className="remove-tile-btn" onClick={onRemove}>×</button>
    </div>
  );
};

const TilesetCreator = ({ onReturnToMenu }) => {
  const [tilesetName, setTilesetName] = useState("MyTileset");
  const [tiles, setTiles] = useState([]);
  const [nextId, setNextId] = useState(0);

  const handleAddTile = () => {
    // ==========================================================
    // CHANGE #3: New tile defaults use the new attributes
    // ==========================================================
    const newTile = {
      id: nextId,
      type_name: `new_tile_${nextId}`,
      texture_path: "",
      textureFile: null,
      textureUrl: null,
      ground_passable: true,
      air_passable: true,
      overwater_passable: false,
      underwater_passable: false,
    };
    setTiles([...tiles, newTile]);
    setNextId(nextId + 1);
  };

  const handleUpdateTile = (updatedTile) => {
    setTiles(tiles.map(t => t.id === updatedTile.id ? updatedTile : t));
  };
  
  const handleRemoveTile = (id) => {
    setTiles(tiles.filter(t => t.id !== id));
  };

  const handleExport = async () => {
    if(!tilesetName) {
        alert("Please provide a tileset name.");
        return;
    }
    const zip = new JSZip();
    const assetsFolder = zip.folder("assets").folder("textures");

    const manifestTiles = tiles.map(tile => {
      if (tile.textureFile) {
        assetsFolder.file(tile.texture_path, tile.textureFile);
      }
      const { id, textureFile, textureUrl, ...manifestTile } = tile;
      return manifestTile;
    });

    const manifest = {
      name: tilesetName,
      tiles: manifestTiles,
    };
    
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${tilesetName}.szts`);
  };

  return (
    <div className="tileset-creator-container">
      <div className="creator-panel">
        <h2>Tileset Creator</h2>
        <input
          type="text"
          value={tilesetName}
          placeholder="Tileset Name"
          onChange={(e) => setTilesetName(e.target.value)}
        />
        <button onClick={handleAddTile}>Add New Tile</button>
        <button onClick={handleExport} disabled={tiles.length === 0}>Export to .szts</button>
        <button onClick={onReturnToMenu} className="return-button">Return to Main Menu</button>
      </div>
      <div className="tiles-list">
        {tiles.length === 0 && <p className="placeholder-text">Click "Add New Tile" to begin.</p>}
        {tiles.map(tile => (
          <TileEditorCard
            key={tile.id}
            tile={tile}
            onUpdate={handleUpdateTile}
            onRemove={() => handleRemoveTile(tile.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default TilesetCreator;
