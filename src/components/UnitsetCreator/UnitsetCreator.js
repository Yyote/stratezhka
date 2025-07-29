import React, { useState, useContext } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { ResourceSetContext } from '../../context/ResourceSetContext';
import { ResearchSetContext } from '../../context/ResearchSetContext';
import './UnitsetCreator.css';

// Helper to create a resource set archive in memory
const createResourceSetArchive = async (resourceSet) => {
    const zip = new JSZip();
    const manifest = { name: resourceSet.name, resources: resourceSet.resources };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    return await zip.generateAsync({ type: "blob" });
};

// Helper to create a research set archive in memory (which itself contains the resource set)
const createResearchSetArchive = async (researchSet, resourceSet) => {
    const zip = new JSZip();
    const resourceSetBlob = await createResourceSetArchive(resourceSet);
    zip.file("resourceset.szrs", resourceSetBlob);
    const manifest = { name: researchSet.name, researches: researchSet.researches };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    return await zip.generateAsync({ type: "blob" });
};


const UnitEditorCard = ({ unit, onUpdate, onRemove, availableResources, availableResearch }) => {
    
    const handleFieldChange = (field, value) => {
        onUpdate({ ...unit, [field]: value });
    };

    const handleNumericChange = (field, value) => {
        onUpdate({ ...unit, [field]: parseFloat(value) || 0 });
    };
    
    const handleCheckboxChange = (field, checked) => {
        onUpdate({ ...unit, [field]: checked });
    };
    
    const handleResearchReqChange = (researchTypeId, isChecked) => {
        const newReqs = isChecked
            ? [...unit.requiresResearch, researchTypeId]
            : unit.requiresResearch.filter(id => id !== researchTypeId);
        onUpdate({ ...unit, requiresResearch: newReqs });
    };

    const handleCostChange = (index, field, value) => {
        const newCost = [...unit.cost];
        newCost[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
        onUpdate({ ...unit, cost: newCost });
    };

    const handleAddCost = () => onUpdate({ ...unit, cost: [...unit.cost, { resourceTypeId: '', amount: 0 }] });
    const handleRemoveCost = (index) => onUpdate({ ...unit, cost: unit.cost.filter((_, i) => i !== index) });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "image/png") {
          onUpdate({ ...unit, texture_path: file.name, textureFile: file });
        } else {
          alert("Please select a valid .png file.");
        }
    };

    return (
        <div className="creator-card">
            <div className="creator-card-header">
                <input type="text" placeholder="Unit TypeId" className="type-id-input" value={unit.TypeId} onChange={(e) => handleFieldChange('TypeId', e.target.value.replace(/\s/g, '_'))} />
                <button className="remove-btn" onClick={onRemove}>×</button>
            </div>
            <div className="creator-card-body">
                <h4>General</h4>
                <input type="text" placeholder="Display Name" className="display-name-input" value={unit.name} onChange={(e) => handleFieldChange('name', e.target.value)} />
                <div className="creator-card-texture">
                    <button onClick={() => document.getElementById(`unit-tex-${unit.id}`).click()}>Set Texture</button>
                    <span>{unit.texture_path || 'No texture set.'}</span>
                    <input type="file" id={`unit-tex-${unit.id}`} style={{ display: 'none' }} onChange={handleFileChange} accept="image/png" />
                </div>

                <h4>Combat & Stats</h4>
                <div className="grid-input-group">
                    <label>Attack:</label><input type="number" min="0" value={unit.attack} onChange={(e) => handleNumericChange('attack', e.target.value)} />
                    <label>Defense:</label><input type="number" min="0" value={unit.defense} onChange={(e) => handleNumericChange('defense', e.target.value)} />
                    <label>Max HP:</label><input type="number" min="1" value={unit.max_hp} onChange={(e) => handleNumericChange('max_hp', e.target.value)} />
                    <label>Min Attack Range:</label><input type="number" min="0" value={unit.min_attack_distance} onChange={(e) => handleNumericChange('min_attack_distance', e.target.value)} />
                    <label>Max Attack Range:</label><input type="number" min="0" value={unit.max_attack_distance} onChange={(e) => handleNumericChange('max_attack_distance', e.target.value)} />
                </div>

                <h4>Build Properties</h4>
                 <div className="grid-input-group">
                    <label>Build Time (turns):</label><input type="number" min="1" value={unit.build_time} onChange={(e) => handleNumericChange('build_time', e.target.value)} />
                </div>
                <div className="cost-list">
                    {unit.cost.map((cost, index) => (
                        <div key={index} className="cost-entry">
                        <select value={cost.resourceTypeId} onChange={(e) => handleCostChange(index, 'resourceTypeId', e.target.value)}>
                            <option value="" disabled>Select Resource</option>
                            {availableResources.map(res => (<option key={res.TypeId} value={res.TypeId}>{res.name}</option>))}
                        </select>
                        <input type="number" min="0" value={cost.amount} onChange={(e) => handleCostChange(index, 'amount', e.target.value)} />
                        <button onClick={() => handleRemoveCost(index)} className="remove-cost-btn">-</button>
                        </div>
                    ))}
                    <button onClick={handleAddCost} className="add-cost-btn">+ Add Cost</button>
                </div>

                <h4>Movement & Traversing</h4>
                <div className="grid-input-group">
                    <label>Movement Radius:</label><input type="number" min="0" value={unit.movement_radius} onChange={(e) => handleNumericChange('movement_radius', e.target.value)} />
                </div>
                 <div className="checkbox-grid-4-cols">
                    <label><input type="checkbox" checked={unit.land_traversing} onChange={(e) => handleCheckboxChange('land_traversing', e.target.checked)} /> Land</label>
                    <label><input type="checkbox" checked={unit.air_traversing} onChange={(e) => handleCheckboxChange('air_traversing', e.target.checked)} /> Air</label>
                    <label><input type="checkbox" checked={unit.overwater_traversing} onChange={(e) => handleCheckboxChange('overwater_traversing', e.target.checked)} /> Overwater</label>
                    <label><input type="checkbox" checked={unit.underwater_traversing} onChange={(e) => handleCheckboxChange('underwater_traversing', e.target.checked)} /> Underwater</label>
                </div>

                <h4>Carrier Abilities</h4>
                <div className="grid-input-group">
                    <label>Carrier Capacity:</label><input type="number" min="0" value={unit.carrier_capability} onChange={(e) => handleNumericChange('carrier_capability', e.target.value)} />
                </div>
                <div className="checkbox-grid-4-cols">
                    <label><input type="checkbox" checked={unit.can_carry_type_land} onChange={(e) => handleCheckboxChange('can_carry_type_land', e.target.checked)} /> Carries Land</label>
                    <label><input type="checkbox" checked={unit.can_carry_type_air} onChange={(e) => handleCheckboxChange('can_carry_type_air', e.target.checked)} /> Carries Air</label>
                    <label><input type="checkbox" checked={unit.can_carry_type_overwater} onChange={(e) => handleCheckboxChange('can_carry_type_overwater', e.target.checked)} /> Carries Overwater</label>
                    <label><input type="checkbox" checked={unit.can_carry_type_underwater} onChange={(e) => handleCheckboxChange('can_carry_type_underwater', e.target.checked)} /> Carries Underwater</label>
                </div>
                
                {/* THE FIX: New section for research requirements */}
                <h4>Requirements</h4>
                <div className="checkbox-grid">
                    {availableResearch.length > 0 ? availableResearch.map(res => (
                        <label key={res.TypeId}>
                            <input type="checkbox" checked={unit.requiresResearch.includes(res.TypeId)} onChange={(e) => handleResearchReqChange(res.TypeId, e.target.checked)} />
                            {res.name}
                        </label>
                    )) : <p>No research available in loaded set.</p>}
                </div>
            </div>
        </div>
    );
};

const UnitsetCreator = ({ onReturnToMenu }) => {
    const { resourceSet } = useContext(ResourceSetContext);
    const { researchSet } = useContext(ResearchSetContext); // Get research from context

    const [setName, setSetName] = useState("MyUnits");
    const [units, setUnits] = useState([]);
    const [nextId, setNextId] = useState(0);

    const handleAddUnit = () => {
        const newUnit = {
            id: nextId,
            TypeId: `new_unit_${nextId}`,
            name: `New Unit ${nextId}`,
            texture_path: "",
            textureFile: null,
            requiresResearch: [],
            land_traversing: true,
            air_traversing: false,
            overwater_traversing: false,
            underwater_traversing: false,
            cost: [],
            build_time: 1,
            movement_radius: 1,
            min_attack_distance: 1,
            max_attack_distance: 1,
            attack: 1,
            defense: 1,
            max_hp: 10,
            carrier_capability: 0,
            can_carry_type_land: false,
            can_carry_type_air: false,
            can_carry_type_overwater: false,
            can_carry_type_underwater: false,
        };
        setUnits([...units, newUnit]);
        setNextId(nextId + 1);
    };

    const handleUpdate = (updated) => {
        setUnits(units.map(u => u.id === updated.id ? updated : u));
    };

    const handleRemove = (id) => setUnits(units.filter(u => u.id !== id));

    const handleExport = async () => {
        if (!resourceSet || resourceSet.name === "None") {
            alert("A Resource Set must be loaded to export a Unit Set.");
            return;
        }
        if (!researchSet || researchSet.name === "None") {
            alert("A Research Set must be loaded to export a Unit Set.");
            return;
        }

        const finalZip = new JSZip();
        const assetsFolder = finalZip.folder("assets").folder("textures");

        // THE FIX: Bundle both research and resource sets as dependencies
        const resourceSetBlob = await createResourceSetArchive(resourceSet);
        finalZip.file("resourceset.szrs", resourceSetBlob);
        
        const researchSetBlob = await createResearchSetArchive(researchSet, resourceSet);
        finalZip.file("researchset.szrsh", researchSetBlob);
        
        const manifestUnits = units.map(u => {
            if (u.textureFile) {
                assetsFolder.file(u.texture_path, u.textureFile);
            }
            const { id, textureFile, ...data } = u;
            return data;
        });

        const manifest = { name: setName, units: manifestUnits };
        finalZip.file("manifest.json", JSON.stringify(manifest, null, 2));
        
        const zipBlob = await finalZip.generateAsync({ type: "blob" });
        saveAs(zipBlob, `${setName}.szus`);
    };

    return (
        <div className="creator-container">
            <div className="creator-panel">
                <h2>Unit Set Creator</h2>
                <p>Depends on Resource Set: <strong>{resourceSet?.name}</strong></p>
                <p>Depends on Research Set: <strong>{researchSet?.name}</strong></p>
                <input type="text" value={setName} placeholder="Unit Set Name" onChange={(e) => setSetName(e.target.value)} />
                <div className="button-group">
                    <button onClick={handleAddUnit}>Add New Unit</button>
                    <button disabled>Import & Edit</button>
                </div>
                <button onClick={handleExport} disabled={units.length === 0}>Export to .szus</button>
                <button onClick={onReturnToMenu} className="return-button">Return to Main Menu</button>
            </div>
            <div className="creator-list">
                {units.map(unit => (
                    <UnitEditorCard
                        key={unit.id}
                        unit={unit}
                        onUpdate={handleUpdate}
                        onRemove={() => handleRemove(unit.id)}
                        availableResources={resourceSet?.resources || []}
                        availableResearch={researchSet?.researches || []}
                    />
                ))}
            </div>
        </div>
    );
};

export default UnitsetCreator;