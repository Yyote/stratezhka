import React, { useState, useContext } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { TilesetContext } from '../../context/TilesetContext';
import './ResourceCreator.css';

const ResourceEditorCard = ({ resource, onUpdate, onRemove, availableTiles }) => {
  const handleFileChange = (e) => {
    // ... file handling logic ...
  };
  
  const handleCanBeOnChange = (tileTypeName, isChecked) => {
    const newCanBeOn = isChecked
      ? [...resource.canBeOn, tileTypeName]
      : resource.canBeOn.filter(t => t !== tileTypeName);
    onUpdate({ ...resource, canBeOn: newCanBeOn });
  };

  const handlePossibilityChange = (tileTypeName, value) => {
    const newPossibility = { ...resource.possibility, [tileTypeName]: value };
    onUpdate({ ...resource, possibility: newPossibility });
  };

  return (
    <div className="creator-card">
      <div className="creator-card-header">
        <input
          type="text"
          placeholder="Resource TypeId"
          className="type-id-input"
          value={resource.TypeId}
          onChange={(e) => onUpdate({ ...resource, TypeId: e.target.value })}
        />
        <button className="remove-btn" onClick={onRemove}>×</button>
      </div>
      <div className="creator-card-body">
        <textarea
          placeholder="Description..."
          value={resource.description}
          onChange={(e) => onUpdate({ ...resource, description: e.target.value })}
        />
        <h4>Spawns On:</h4>
        <div className="checkbox-grid">
          {availableTiles.map(tile => (
            <label key={tile.type_name}>
              <input
                type="checkbox"
                checked={resource.canBeOn.includes(tile.type_name)}
                onChange={(e) => handleCanBeOnChange(tile.type_name, e.target.checked)}
              /> {tile.type_name}
            </label>
          ))}
        </div>
        <h4>Spawn Chance (0.0 - 1.0):</h4>
        <div className="possibility-grid">
          {resource.canBeOn.map(tileTypeName => (
            <div key={tileTypeName} className="possibility-input">
              <label>{tileTypeName}:</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={resource.possibility[tileTypeName] || ''}
                onChange={(e) => handlePossibilityChange(tileTypeName, parseFloat(e.target.value))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ResourceCreator = ({ onReturnToMenu }) => {
  const { tileset } = useContext(TilesetContext); // Depends on the loaded tileset
  const [setName, setSetName] = useState("MyResources");
  const [resources, setResources] = useState([]);
  const [nextId, setNextId] = useState(0);

  const handleAddResource = () => {
    const newResource = {
      id: nextId, // Local UI-only ID
      TypeId: `resource_${nextId}`,
      texture_path: "",
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

  const handleExport = async () => { /* ... similar to other creators ... */ };

  return (
    <div className="creator-container">
      <div className="creator-panel">
        <h2>Resource Set Creator</h2>
        <p>Depends on Tileset: <strong>{tileset?.name}</strong></p>
        <input
          type="text"
          value={setName}
          onChange={(e) => setSetName(e.target.value)}
        />
        <button onClick={handleAddResource}>Add New Resource</button>
        <button onClick={handleExport} disabled={resources.length === 0}>Export to .szrs</button>
        <button onClick={onReturnToMenu} className="return-button">Return to Main Menu</button>
      </div>
      <div className="creator-list">
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