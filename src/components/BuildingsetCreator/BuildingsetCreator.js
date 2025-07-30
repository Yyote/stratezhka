import React, { useState, useContext } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { ResourceSetContext } from '../../context/ResourceSetContext';
import { ResearchSetContext } from '../../context/ResearchSetContext';
import { UnitsetContext } from '../../context/UnitsetContext';
import './BuildingsetCreator.css';

// Helper to create archives for dependencies in memory
const createResourceSetArchive = async (resourceSet) => {
    const zip = new JSZip();
    zip.file("manifest.json", JSON.stringify({ name: resourceSet.name, resources: resourceSet.resources }, null, 2));
    return await zip.generateAsync({ type: "blob" });
};
const createResearchSetArchive = async (researchSet, resourceSet) => {
    const zip = new JSZip();
    zip.file("resourceset.szrs", await createResourceSetArchive(resourceSet));
    zip.file("manifest.json", JSON.stringify({ name: researchSet.name, researches: researchSet.researches }, null, 2));
    return await zip.generateAsync({ type: "blob" });
};
const createUnitsetArchive = async (unitSet, researchSet, resourceSet) => {
    const zip = new JSZip();
    zip.file("resourceset.szrs", await createResourceSetArchive(resourceSet));
    zip.file("researchset.szrsh", await createResearchSetArchive(researchSet, resourceSet));
    zip.file("manifest.json", JSON.stringify({ name: unitSet.name, units: unitSet.units }, null, 2));
    // Note: This simplified version doesn't bundle unit textures. A full implementation would.
    return await zip.generateAsync({ type: "blob" });
};


const BuildingEditorCard = ({ building, onUpdate, onRemove, availableResources, availableResearch, availableUnits }) => {

    const handleFieldChange = (field, value) => onUpdate({ ...building, [field]: value });
    const handleNumericChange = (field, value) => onUpdate({ ...building, [field]: parseFloat(value) || 0 });
    const handleCheckboxChange = (field, checked) => onUpdate({ ...building, [field]: checked });
    const handleMultiSelectChange = (field, typeId, isChecked) => {
        const currentSelection = building[field] || [];
        const newSelection = isChecked
            ? [...currentSelection, typeId]
            : currentSelection.filter(id => id !== typeId);
        onUpdate({ ...building, [field]: newSelection });
    };

    return (
        <div className="creator-card">
            <div className="creator-card-header">
                <input type="text" placeholder="Building TypeId" className="type-id-input" value={building.TypeId} onChange={(e) => handleFieldChange('TypeId', e.target.value.replace(/\s/g, '_'))} />
                <button className="remove-btn" onClick={onRemove}>×</button>
            </div>
            <div className="creator-card-body">
                <h4>General</h4>
                <input type="text" placeholder="Display Name" className="display-name-input" value={building.name} onChange={(e) => handleFieldChange('name', e.target.value)} />
                {/* Texture input would go here */}

                <h4>Positioning</h4>
                <div className="checkbox-grid-4-cols">
                    <label><input type="checkbox" checked={building.land_positioned} onChange={(e) => handleCheckboxChange('land_positioned', e.target.checked)} /> Land</label>
                    <label><input type="checkbox" checked={building.air_positioned} onChange={(e) => handleCheckboxChange('air_positioned', e.target.checked)} /> Air</label>
                    <label><input type="checkbox" checked={building.overwater_positioned} onChange={(e) => handleCheckboxChange('overwater_positioned', e.target.checked)} /> Overwater</label>
                    <label><input type="checkbox" checked={building.underwater_positioned} onChange={(e) => handleCheckboxChange('underwater_positioned', e.target.checked)} /> Underwater</label>
                </div>

                <h4>Combat & Bonuses</h4>
                <div className="grid-input-group">
                    <label>Attack:</label><input type="number" min="0" value={building.attack} onChange={(e) => handleNumericChange('attack', e.target.value)} />
                    <label>Defense:</label><input type="number" min="0" value={building.defense} onChange={(e) => handleNumericChange('defense', e.target.value)} />
                    <label>Max HP:</label><input type="number" min="1" value={building.max_hp} onChange={(e) => handleNumericChange('max_hp', e.target.value)} />
                    <label>Attack Bonus:</label><input type="number" min="0" value={building.gives_attack_bonus} onChange={(e) => handleNumericChange('gives_attack_bonus', e.target.value)} />
                    <label>Defense Bonus:</label><input type="number" min="0" value={building.gives_defense_bonus} onChange={(e) => handleNumericChange('gives_defense_bonus', e.target.value)} />
                </div>
                
                <h4>Production</h4>
                <div className="grid-input-group">
                    <label>Build Time (turns):</label><input type="number" min="1" value={building.build_time} onChange={(e) => handleNumericChange('build_time', e.target.value)} />
                    <label>Mines Resource:</label>
                    <select value={building.canMine || ''} onChange={(e) => handleFieldChange('canMine', e.target.value || null)}>
                        <option value="">None</option>
                        {availableResources.map(res => <option key={res.TypeId} value={res.TypeId}>{res.name}</option>)}
                    </select>
                </div>
                <h5>Can Build Units:</h5>
                <div className="checkbox-grid">
                    {availableUnits.map(unit => <label key={unit.TypeId}><input type="checkbox" checked={building.canBuild.includes(unit.TypeId)} onChange={e => handleMultiSelectChange('canBuild', unit.TypeId, e.target.checked)} /> {unit.name}</label>)}
                </div>

                <h4>Research</h4>
                <h5>Requires Research:</h5>
                <div className="checkbox-grid">
                    {availableResearch.map(res => <label key={res.TypeId}><input type="checkbox" checked={building.requiresResearch.includes(res.TypeId)} onChange={e => handleMultiSelectChange('requiresResearch', res.TypeId, e.target.checked)} /> {res.name}</label>)}
                </div>
                <h5>Can Perform Research:</h5>
                 <div className="checkbox-grid">
                    {availableResearch.map(res => <label key={res.TypeId}><input type="checkbox" checked={building.can_research.includes(res.TypeId)} onChange={e => handleMultiSelectChange('can_research', res.TypeId, e.target.checked)} /> {res.name}</label>)}
                </div>

            </div>
        </div>
    );
};


const BuildingsetCreator = ({ onReturnToMenu }) => {
    const { resourceSet } = useContext(ResourceSetContext);
    const { unitSet } = useContext(UnitsetContext);
    const { researchSet } = useContext(ResearchSetContext);

    const [setName, setSetName] = useState("MyBuildings");
    const [buildings, setBuildings] = useState([]);
    const [nextId, setNextId] = useState(0);

    const handleAddBuilding = () => {
        const newBuilding = {
            id: nextId, TypeId: `new_bld_${nextId}`, name: `New Building ${nextId}`, requiresResearch: [],
            texture_path: "", land_positioned: true, air_positioned: false, overwater_positioned: false, underwater_positioned: false,
            canBuild: [], cost: [], build_time: 1, attack: 0, defense: 5, max_hp: 50, gives_attack_bonus: 0,
            gives_defense_bonus: 0, can_research: [], canMine: null,
        };
        setBuildings([...buildings, newBuilding]);
        setNextId(nextId + 1);
    };
    
    const handleUpdate = (updated) => setBuildings(buildings.map(b => b.id === updated.id ? updated : b));
    const handleRemove = (id) => setBuildings(buildings.filter(b => b.id !== id));

    const handleExport = async () => {
        if (!resourceSet?.name || resourceSet.name === "None" || !researchSet?.name || researchSet.name === "None" || !unitSet?.name || unitSet.name === "None") {
            alert("A Resource, Research, and Unit Set must all be loaded to export a Building Set.");
            return;
        }

        const finalZip = new JSZip();
        // Bundle all dependencies
        finalZip.file("resourceset.szrs", await createResourceSetArchive(resourceSet));
        finalZip.file("researchset.szrsh", await createResearchSetArchive(researchSet, resourceSet));
        finalZip.file("unitset.szus", await createUnitsetArchive(unitSet, researchSet, resourceSet));
        
        // Create building set manifest
        const manifestBuildings = buildings.map(b => { const { id, ...data } = b; return data; });
        const manifest = { name: setName, buildings: manifestBuildings };
        finalZip.file("manifest.json", JSON.stringify(manifest, null, 2));
        
        const zipBlob = await finalZip.generateAsync({ type: "blob" });
        saveAs(zipBlob, `${setName}.szbs`);
    };

    return (
        <div className="creator-container">
            <div className="creator-panel">
                <h2>Building Set Creator</h2>
                <p>Depends on Resource Set: <strong>{resourceSet?.name}</strong></p>
                <p>Depends on Research Set: <strong>{researchSet?.name}</strong></p>
                <p>Depends on Unit Set: <strong>{unitSet?.name}</strong></p>
                <input type="text" value={setName} placeholder="Building Set Name" onChange={(e) => setSetName(e.target.value)} />
                <div className="button-group">
                    <button onClick={handleAddBuilding}>Add New Building</button>
                    <button disabled>Import & Edit</button>
                </div>
                <button onClick={handleExport} disabled={buildings.length === 0}>Export to .szbs</button>
                <button onClick={onReturnToMenu} className="return-button">Return to Main Menu</button>
            </div>
            <div className="creator-list">
                 {buildings.map(bld => (
                    <BuildingEditorCard
                        key={bld.id}
                        building={bld}
                        onUpdate={handleUpdate}
                        onRemove={() => handleRemove(bld.id)}
                        availableResources={resourceSet?.resources || []}
                        availableResearch={researchSet?.researches || []}
                        availableUnits={unitSet?.units || []}
                    />
                ))}
            </div>
        </div>
    );
};

export default BuildingsetCreator;