import React from 'react';
import './CellTooltip.css';

const CellTooltip = ({ tooltipData, players, resourceSet }) => {
    if (!tooltipData || !tooltipData.visible) {
        return null;
    }

    const { cell, position } = tooltipData;

    // Helper to get texture URL from a resource TypeId
    const getResourceTexture = (typeId) => {
        return resourceSet?.resources.find(r => r.TypeId === typeId)?.textureUrl || null;
    };
    
    // Aggregate units and buildings by player
    const entitiesByPlayer = {};
    if (cell.units) {
        cell.units.forEach(unit => {
            if (!entitiesByPlayer[unit.playerId]) {
                entitiesByPlayer[unit.playerId] = { player: players.find(p => p.id === unit.playerId), units: {}, buildings: {} };
            }
            entitiesByPlayer[unit.playerId].units[unit.name] = (entitiesByPlayer[unit.playerId].units[unit.name] || 0) + 1;
        });
    }
     if (cell.city) { // Assuming a cell can only have one city/building
        const city = cell.city;
        if (!entitiesByPlayer[city.playerId]) {
            entitiesByPlayer[city.playerId] = { player: players.find(p => p.id === city.playerId), units: {}, buildings: {} };
        }
        entitiesByPlayer[city.playerId].buildings["City"] = (entitiesByPlayer[city.playerId].buildings["City"] || 0) + 1;
    }


    return (
        <div className="cell-tooltip" style={{ top: position.y + 15, left: position.x + 15, opacity: 1 }}>
            <div className="tooltip-header">Cell ({cell.row}, {cell.col})</div>

            {cell.resources?.length > 0 && (
                <div className="tooltip-section">
                    <h5>Resources</h5>
                    <div className="tooltip-item-list">
                        {cell.resources.map((res, index) => (
                            <div key={index} className="tooltip-item">
                                <img src={getResourceTexture(res.typeId)} alt={res.typeId} />
                                <span className="tooltip-item-name">{res.typeId}</span>
                                <span className="tooltip-item-count" style={{color: 'white'}}>x{res.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {Object.values(entitiesByPlayer).map(({ player, units, buildings }) => (
                <div key={player.id} className="tooltip-section">
                    <h5 style={{ color: player.color }}>{player.name}</h5>
                    <div className="tooltip-item-list">
                        {Object.entries(units).map(([name, count]) => (
                             <div key={name} className="tooltip-item">
                                {/* Placeholder for unit texture */}
                                <span className="tooltip-item-name">{name}</span>
                                <span className="tooltip-item-count" style={{color: player.color}}>x{count}</span>
                            </div>
                        ))}
                         {Object.entries(buildings).map(([name, count]) => (
                             <div key={name} className="tooltip-item">
                                {/* Placeholder for building texture */}
                                <span className="tooltip-item-name">{name}</span>
                                <span className="tooltip-item-count" style={{color: player.color}}>x{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CellTooltip;