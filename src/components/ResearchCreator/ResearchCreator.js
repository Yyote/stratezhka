import React, { useState, useContext, useRef } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { ResourceSetContext } from '../../context/ResourceSetContext';
import './ResearchCreator.css';

const ResearchEditorCard = ({ research, onUpdate, onRemove, availableResources }) => {
  const handleCostChange = (index, field, value) => {
    const newCost = [...research.cost];
    newCost[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    onUpdate({ ...research, cost: newCost });
  };

  const handleAddCost = () => {
    const newCost = [...research.cost, { resourceTypeId: '', amount: 0 }];
    onUpdate({ ...research, cost: newCost });
  };

  const handleRemoveCost = (index) => {
    const newCost = research.cost.filter((_, i) => i !== index);
    onUpdate({ ...research, cost: newCost });
  };

  return (
    <div className="creator-card">
      <div className="creator-card-header">
        <input type="text" placeholder="Research TypeId" className="type-id-input" value={research.TypeId} onChange={(e) => onUpdate({ ...research, TypeId: e.target.value.replace(/\s/g, '_') })} />
        <button className="remove-btn" onClick={onRemove}>×</button>
      </div>
      <div className="creator-card-body">
        <input type="text" placeholder="Display Name" className="display-name-input" value={research.name} onChange={(e) => onUpdate({ ...research, name: e.target.value })} />
        <textarea placeholder="Description..." value={research.description} onChange={(e) => onUpdate({ ...research, description: e.target.value })} />
        <h4>Cost (from current Resource Set):</h4>
        <div className="cost-list">
          {research.cost.map((cost, index) => (
            <div key={index} className="cost-entry">
              <select value={cost.resourceTypeId} onChange={(e) => handleCostChange(index, 'resourceTypeId', e.target.value)}>
                <option value="" disabled>Select Resource</option>
                {availableResources.map(res => (<option key={res.TypeId} value={res.TypeId}>{res.name} ({res.TypeId})</option>))}
              </select>
              <input type="number" min="0" placeholder="Amount" value={cost.amount} onChange={(e) => handleCostChange(index, 'amount', e.target.value)} />
              <button onClick={() => handleRemoveCost(index)} className="remove-cost-btn">-</button>
            </div>
          ))}
          <button onClick={handleAddCost} className="add-cost-btn">+ Add Cost</button>
        </div>
      </div>
    </div>
  );
};

const ResearchCreator = ({ onReturnToMenu }) => {
  const { resourceSet } = useContext(ResourceSetContext);
  const [setName, setSetName] = useState("MyResearch");
  const [researches, setResearches] = useState([]);
  const [nextId, setNextId] = useState(0);
  const importInputRef = useRef(null);

  const handleAddResearch = () => {
    const newResearch = { id: nextId, TypeId: `new_tech_${nextId}`, name: `New Tech ${nextId}`, description: "", cost: [] };
    setResearches([...researches, newResearch]);
    setNextId(nextId + 1);
  };

  const handleUpdate = (updated) => { setResearches(researches.map(r => r.id === updated.id ? updated : r)); };
  const handleRemove = (id) => { setResearches(researches.filter(r => r.id !== id)); };

  const handleExport = async () => {
    if (!setName) { alert("Please provide a set name."); return; }
    const zip = new JSZip();
    const manifestResearches = researches.map(res => { const { id, ...manifestData } = res; return manifestData; });
    const manifest = { name: setName, researches: manifestResearches };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${setName}.szrsh`);
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
        const importedResearches = (manifest.researches || []).map(resData => {
            currentId++;
            return { ...resData, id: currentId };
        });
        setResearches(importedResearches);
        setNextId(currentId);
    } catch (error) {
        alert("Failed to import research set: " + error.message);
    }
    event.target.value = null;
  };

  return (
    <div className="creator-container">
      <div className="creator-panel">
        <h2>Research Set Creator</h2>
        <p>Depends on Resource Set: <strong>{resourceSet?.name}</strong></p>
        <input type="text" value={setName} placeholder="Research Set Name" onChange={(e) => setSetName(e.target.value)} />
        <div className="button-group">
            <button onClick={handleAddResearch}>Add New</button>
            <button onClick={() => importInputRef.current.click()}>Import & Edit</button>
        </div>
        <input type="file" ref={importInputRef} onChange={handleImportSet} style={{ display: 'none' }} accept=".szrsh" />
        <button onClick={handleExport} disabled={researches.length === 0}>Export to .szrsh</button>
        <button onClick={onReturnToMenu} className="return-button">Return to Main Menu</button>
      </div>
      <div className="creator-list">
        {resourceSet?.resources.length === 0 && <p className="placeholder-text">Please import a Resource Set (.szrs) from the Main Menu to begin.</p>}
        {researches.map(res => (
          <ResearchEditorCard
            key={res.id}
            research={res}
            onUpdate={handleUpdate}
            onRemove={() => handleRemove(res.id)}
            availableResources={resourceSet?.resources || []}
          />
        ))}
      </div>
    </div>
  );
};

export default ResearchCreator;