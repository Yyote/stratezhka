import React, { useMemo } from 'react';
import './ActionMenu.css';

const ActionMenu = ({ building, player, unitSet, researchSet, onQueueUnit, onQueueResearch, onClose }) => {
    
    // A memoized Set for quick lookups of the player's completed research
    const completedResearchSet = useMemo(() => new Set(player.completedResearch), [player.completedResearch]);

    const canResearch = (tech) => {
        if (!tech.requiresResearch || tech.requiresResearch.length === 0) {
            return true; // No requirements
        }
        // Returns true only if every required tech is in the player's completed set
        return tech.requiresResearch.every(reqId => completedResearchSet.has(reqId));
    };

    const buildableUnits = unitSet.units.filter(unit => building.canBuild.includes(unit.TypeId));
    const researchableTechs = researchSet.researches.filter(tech => building.can_research.includes(tech.TypeId));

    return (
        <div className="action-menu-wrapper" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <div className="action-menu-header">
                <h3>{building.name} Actions</h3>
                <button className="action-menu-close-btn" onClick={onClose}>×</button>
            </div>

            {buildableUnits.length > 0 && (
                <div className="action-menu-section">
                    <h4>Build Units</h4>
                    <div className="action-menu-list">
                        {buildableUnits.map(unit => {
                            const isResearchComplete = canResearch(unit);
                            return (
                                <button key={unit.TypeId} onClick={() => onQueueUnit(building.id, unit.TypeId)} disabled={!isResearchComplete}>
                                    {unit.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {researchableTechs.length > 0 && (
                <div className="action-menu-section">
                    <h4>Research</h4>
                    <div className="action-menu-list">
                         {researchableTechs.map(tech => {
                            const isResearchComplete = canResearch(tech);
                            // Also disable if already completed
                            const isAlreadyDone = completedResearchSet.has(tech.TypeId);
                            return (
                                <button key={tech.TypeId} onClick={() => onQueueResearch(tech.TypeId)} disabled={!isResearchComplete || isAlreadyDone}>
                                    {tech.name} {isAlreadyDone && "(Done)"}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActionMenu;