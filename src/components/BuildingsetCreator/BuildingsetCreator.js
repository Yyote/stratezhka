import React, { useState, useContext } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { ResourceSetContext } from '../../context/ResourceSetContext';
import { UnitsetContext } from '../../context/UnitsetContext';
import { ResearchSetContext } from '../../context/ResearchSetContext';
import './BuildingsetCreator.css';


const BuildingsetCreator = ({ onReturnToMenu }) => {
    const { resourceSet } = useContext(ResourceSetContext);
    const { unitSet } = useContext(UnitsetContext);
    const { researchSet } = useContext(ResearchSetContext); // Get from context

    const handleExport = () => {
        alert("Export functionality for Building Sets is not yet implemented.");
    };

    return (
        <div className="creator-container">
            <div className="creator-panel">
                <h2>Building Set Creator</h2>
                <p>Depends on Resource Set: <strong>{resourceSet?.name}</strong></p>
                <p>Depends on Research Set: <strong>{researchSet?.name}</strong></p>
                <p>Depends on Unit Set: <strong>{unitSet?.name}</strong></p>
                <input type="text" placeholder="Building Set Name" />
                <div className="button-group">
                    <button>Add New Building</button>
                    <button disabled>Import & Edit</button>
                </div>
                <button onClick={handleExport}>Export to .szbs</button>
                <button onClick={onReturnToMenu} className="return-button">Return to Main Menu</button>
            </div>
            <div className="creator-list">
                <p className="placeholder-text">Building creator is a work in progress.</p>
            </div>
        </div>
    );
};

export default BuildingsetCreator;