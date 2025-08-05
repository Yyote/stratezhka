import React, { useState, useRef } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import './TilesetCreator.css';

const TileEditorCard = ({ tile, onUpdate, onRemove }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "image/png") {
      const textureUrl = URL.createObjectURL(file);
      onUpdate({ ...tile, texture_path: file.name, textureFile: file, textureUrl, textureBlob: null });
    } else {
      alert("Please select a valid .png file.");
    }
  };

  return (
    <div className="creator-card">
        <div className="creator-card-header">
            <input
                type="text"
                placeholder="Tile TypeId"
                className="type-id-input"
                value={tile.type_name}
                onChange={(e) => onUpdate({ ...tile, type_name: e.target.value.replace(/\s/g, '_') })}
            />
            <div className="creator-card-texture">
                {tile.textureUrl && <img src={tile.textureUrl} alt="preview" />}
                <button onClick={() => document.getElementById(`tile-file-${tile.id}`).click()}>Set Texture</button>
                <input type="file" id={`tile-file-${tile.id}`} style={{ display: 'none' }} onChange={handleFileChange} accept="image/png" />
            </div>
            <button className="remove-btn" onClick={onRemove}>×</button>
        </div>
      <div className="creator-card-body">
        <h4>Properties</h4>
        <div className="grid-input-group">
            <label>Movement Cost:</label>
            <input type="number" min="0" value={tile.consumes_movement} onChange={(e) => onUpdate({ ...tile, consumes_movement: parseFloat(e.target.value) || 0 })} />
        </div>
        <h4>Passability</h4>
        <div className="checkbox-grid">
            <label><input type="checkbox" checked={tile.land_passable} onChange={(e) => onUpdate({ ...tile, land_passable: e.target.checked })} /> Land</label>
            <label><input type="checkbox" checked={tile.air_passable} onChange={(e) => onUpdate({ ...tile, air_passable: e.target.checked })} /> Air</label>
            <label><input type="checkbox" checked={tile.overwater_passable} onChange={(e) => onUpdate({ ...tile, overwater_passable: e.target.checked })} /> Overwater</label>
            <label><input type="checkbox" checked={tile.underwater_passable} onChange={(e) => onUpdate({ ...tile, underwater_passable: e.target.checked })} /> Underwater</label>
            <label><input type="checkbox" checked={tile.shallow_water_passable} onChange={(e) => onUpdate({ ...tile, shallow_water_passable: e.target.checked })} /> Shallow Water</label>
        </div>
      </div>
    </div>
  );
};

const TilesetCreator = ({ onReturnToMenu }) => {
  const [tilesetName, setTilesetName] = useState("MyTileset");
  const [tiles, setTiles] = useState([]);
  const [nextId, setNextId] = useState(0);
  const importInputRef = useRef(null);

  const handleAddTile = () => {
    const newTile = {
      id: nextId,
      type_name: `new_tile_${nextId}`,
      texture_path: "",
      textureFile: null,
      textureBlob: null,
      textureUrl: null,
      land_passable: true,
      air_passable: true,
      overwater_passable: false,
      underwater_passable: false,
      shallow_water_passable: false,
      consumes_movement: 1,
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
    if(!tilesetName) { alert("Please provide a tileset name."); return; }
    const zip = new JSZip();
    const assetsFolder = zip.folder("assets").folder("textures");

    const manifestTiles = tiles.map(tile => {
      if (tile.textureFile) {
        assetsFolder.file(tile.texture_path, tile.textureFile);
      } else if (tile.textureBlob) {
        assetsFolder.file(tile.texture_path, tile.textureBlob);
      }
      const { id, textureFile, textureUrl, textureBlob, ...manifestTile } = tile;
      return manifestTile;
    });

    const manifest = { name: tilesetName, tiles: manifestTiles };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${tilesetName}.szts`);
  };

  const handleImportSet = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
        const zip = await JSZip.loadAsync(file);
        const manifestFile = zip.file("manifest.json");
        if (!manifestFile) throw new Error("manifest.json not found.");
        const manifest = JSON.parse(await manifestFile.async("string"));
        setTilesetName(manifest.name);

        let currentId = 0;
        const importedTiles = await Promise.all(
            (manifest.tiles || []).map(async (tileData) => {
                const textureFile = zip.file(`assets/textures/${tileData.texture_path}`);
                let textureUrl = null, textureBlob = null;
                if (textureFile) {
                    textureBlob = await textureFile.async("blob");
                    textureUrl = URL.createObjectURL(textureBlob);
                }
                currentId++;
                return { ...tileData, id: currentId, textureUrl, textureBlob, textureFile: null };
            })
        );
        setTiles(importedTiles);
        setNextId(currentId);
    } catch (error) {
        alert("Failed to import tileset: " + error.message);
    }
    event.target.value = null;
  };

  return (
    <div className="creator-container">
      <div className="creator-panel">
        <h2>Tileset Creator</h2>
        <input type="text" value={tilesetName} placeholder="Tileset Name" onChange={(e) => setTilesetName(e.target.value)} />
        <div className="button-group">
            <button onClick={handleAddTile}>Add New Tile</button>
            <button onClick={() => importInputRef.current.click()}>Import & Edit .szts</button>
        </div>
        <input type="file" ref={importInputRef} onChange={handleImportSet} style={{ display: 'none' }} accept=".szts" />
        <button onClick={handleExport} disabled={tiles.length === 0}>Export to .szts</button>
        <button onClick={onReturnToMenu} className="return-button">Return to Main Menu</button>
      </div>
      <div className="creator-list">
        {tiles.length === 0 && <p className="placeholder-text">Click "Add New Tile" or "Import" to begin.</p>}
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