import React, { useState, useContext, useRef } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { TilesetContext } from '../../context/TilesetContext';
import './ResourceCreator.css';

const ResourceEditorCard = ({ resource, onUpdate, onRemove, availableTiles }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "image/png") {
      const textureUrl = URL.createObjectURL(file);
      onUpdate({ ...resource, texture_path: file.name, textureFile: file, textureUrl, textureBlob: null });
    } else {
      alert("Please select a valid .png file.");
    }
  };

  const handleCanBeOnChange = (tileTypeName, isChecked) => {
    const newCanBeOn = isChecked
      ? [...resource.canBeOn, tileTypeName]
      : resource.canBeOn.filter(t => t !== tileTypeName);
    onUpdate({ ...resource, canBeOn: newCanBeOn });
  };

  const handlePossibilityChange = (tileTypeName, value) => {
    const clampedValue = Math.max(0, Math.min(1, value));
    const newPossibility = { ...resource.possibility, [tileTypeName]: clampedValue };
    onUpdate({ ...resource, possibility: newPossibility });
  };

  return (
    <div className="creator-card">
      <div className="creator-card-header">
        <input type="text" placeholder="Resource TypeId" className="type-id-input" value={resource.TypeId} onChange={(e) => onUpdate({ ...resource, TypeId: e.target.value.replace(/\s/g, '_') })} />
        <div className="creator-card-texture">
            {resource.textureUrl && <img src={resource.textureUrl} alt="preview" />}
            <button onClick={() => document.getElementById(`res-file-${resource.id}`).click()}>Set Texture</button>
            <input type="file" id={`res-file-${resource.id}`} style={{ display: 'none' }} onChange={handleFileChange} accept="image/png" />
        </div>
        <button className="remove-btn" onClick={onRemove}>×</button>
      </div>
      <div className="creator-card-body">
        <input type="text" placeholder="Display Name" className="display-name-input" value={resource.name} onChange={(e) => onUpdate({ ...resource, name: e.target.value })}/>
        <textarea placeholder="Description..." value={resource.description} onChange={(e) => onUpdate({ ...resource, description: e.target.value })}/>
        <h4>Spawns On (from current Tileset):</h4>
        <div className="checkbox-grid">
          {availableTiles.map(tile => (
            <label key={tile.type_name} className="checkbox-label">
              <input type="checkbox" checked={resource.canBeOn.includes(tile.type_name)} onChange={(e) => handleCanBeOnChange(tile.type_name, e.target.checked)}/> {tile.type_name}
            </label>
          ))}
        </div>
        {resource.canBeOn.length > 0 && (
            <>
                <h4>Spawn Chance (0.0 to 1.0):</h4>
                <div className="possibility-grid">
                {resource.canBeOn.map(tileTypeName => (
                    <div key={tileTypeName} className="possibility-input">
                    <label>{tileTypeName}:</label>
                    <input type="number" step="0.01" min="0" max="1" placeholder="e.g. 0.1" value={resource.possibility[tileTypeName] || ''} onChange={(e) => handlePossibilityChange(tileTypeName, parseFloat(e.target.value))}/>
                    </div>
                ))}
                </div>
            </>
        )}
      </div>
    </div>
  );
};

const ResourceCreator = ({ onReturnToMenu }) => {
  const { tileset } = useContext(TilesetContext);
  const [setName, setSetName] = useState("MyResources");
  const [resources, setResources] = useState([]);
  const [nextId, setNextId] = useState(0);
  const importInputRef = useRef(null);

  const handleAddResource = () => {
    const newResource = {
      id: nextId,
      TypeId: `new_resource_${nextId}`,
      name: `New Resource ${nextId}`,
      texture_path: "",
      textureFile: null,
      textureBlob: null,
      textureUrl: null,
      canBeOn: [],
      possibility: {},
      description: "",
    };
    setResources([...resources, newResource]);
    setNextId(nextId + 1);
  };

  const handleUpdate = (updated) => {
    setResources(resources.map(r => r.id === updated.id ? updated : r));
  };
  
  const handleRemove = (id) => {
    setResources(resources.filter(r => r.id !== id));
  };

  const handleExport = async () => {
    if (!setName) { alert("Please provide a set name."); return; }
    const zip = new JSZip();
    const assetsFolder = zip.folder("assets").folder("textures");

    const manifestResources = resources.map(res => {
      // THE FIX: Check for both file and blob to handle new and imported textures
      if (res.textureFile) {
        assetsFolder.file(res.texture_path, res.textureFile);
      } else if (res.textureBlob) {
        assetsFolder.file(res.texture_path, res.textureBlob);
      }
      const { id, textureFile, textureUrl, textureBlob, ...manifestData } = res;
      return manifestData;
    });

    const manifest = { name: setName, resources: manifestResources };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${setName}.szrs`);
  };

  const handleImportSet = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const zip = await JSZip.loadAsync(file);
        const manifestFile = zip.file("manifest.json");
        if (!manifestFile) throw new Error("manifest.json not found.");

        const manifest = JSON.parse(await manifestFile.async("string"));
        setSetName(manifest.name);

        let currentId = 0;
        const importedResources = await Promise.all(
            (manifest.resources || []).map(async (resData) => {
                const textureFile = zip.file(`assets/textures/${resData.texture_path}`);
                let textureUrl = null;
                let textureBlob = null;
                if (textureFile) {
                    textureBlob = await textureFile.async("blob");
                    textureUrl = URL.createObjectURL(textureBlob);
                }
                currentId++;
                return {
                    ...resData,
                    id: currentId,
                    textureUrl,
                    textureBlob,
                    textureFile: null,
                };
            })
        );
        setResources(importedResources);
        setNextId(currentId);

    } catch (error) {
        alert("Failed to import resource set: " + error.message);
    }
    event.target.value = null;
  };

  return (
    <div className="creator-container">
      <div className="creator-panel">
        <h2>Resource Set Creator</h2>
        <p>Depends on Tileset: <strong>{tileset?.name}</strong></p>
        <input type="text" value={setName} placeholder="Resource Set Name" onChange={(e) => setSetName(e.target.value)} />
        <div className="button-group">
            <button onClick={handleAddResource}>Add New Resource</button>
            <button onClick={() => importInputRef.current.click()}>Import & Edit .szrs</button>
        </div>
        <input type="file" ref={importInputRef} onChange={handleImportSet} style={{ display: 'none' }} accept=".szrs" />
        <button onClick={handleExport} disabled={resources.length === 0}>Export to .szrs</button>
        <button onClick={onReturnToMenu} className="return-button">Return to Main Menu</button>
      </div>
      <div className="creator-list">
        {resources.length === 0 && <p className="placeholder-text">Click "Add New Resource" or "Import" to begin.</p>}
        {resources.map(res => (
          <ResourceEditorCard
            key={res.id}
            resource={res}
            onUpdate={handleUpdate}
            onRemove={() => handleRemove(res.id)}
            availableTiles={tileset?.tiles || []}
          />
        ))}
      </div>
    </div>
  );
};

export default ResourceCreator;