import React, { useMemo, useContext } from 'react';
import { ResourceSetContext } from '../../context/ResourceSetContext';
import { BuildingsetContext } from '../../context/BuildingsetContext';
import './Cell.css';

const Cell = ({ id, cellData, entities, players, onMouseEnter, onMouseLeave, onMouseMove, onClick, onContextMenu }) => {
  const { resourceSet } = useContext(ResourceSetContext);
  const { buildingSet } = useContext(BuildingsetContext);

  const getPlayer = (id) => players.find(p => p.id === id);

  const getResourceTexture = (typeId) => {
    return resourceSet?.resources.find(r => r.TypeId === typeId)?.textureUrl || null;
  };

  const getBuildingTexture = (typeId) => {
      if(typeId === 'city') return null;
      return buildingSet?.buildings.find(b => b.TypeId === typeId)?.textureUrl || null;
  };

  const cellOwner = useMemo(() => {
    if (!entities || !entities.buildings || entities.buildings.length === 0) return null;
    const city = entities.buildings.find(b => b.TypeId === 'city');
    if (city) return getPlayer(city.playerId);
    return getPlayer(entities.buildings[0].playerId);
  }, [entities, players]);

  const overlayBackgroundColor = useMemo(() => {
    if (!cellOwner) return 'transparent';
    return cellOwner.color.replace('hsl', 'hsla').replace(')', ', 0.2)');
  }, [cellOwner]);

  return (
    <div
        id={id}
        className="cell"
        style={{ backgroundImage: `url(${cellData.texture})` }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onMouseMove={onMouseMove}
        onClick={onClick}
        onContextMenu={onContextMenu}
    >
      <div 
          className="cell-overlay"
          style={{ backgroundColor: overlayBackgroundColor }}
      ></div>

      {/* Render Roads first (lowest layer) */}
      {entities?.buildings.filter(b => b.isRoad).map(road => {
          const texture = getBuildingTexture(road.TypeId);
          return <img key={road.id} src={texture} alt={road.name} className="road-sprite" />
      })}

      {/* Render other buildings next */}
      {entities?.buildings.filter(b => !b.isRoad && b.TypeId !== 'city').map(building => {
          const texture = getBuildingTexture(building.TypeId);
          return <img key={building.id} src={texture} alt={building.name} className="entity-sprite" />
      })}
      
      {/* Render City Marker on top */}
      {entities?.buildings.some(b => b.TypeId === 'city') && (
        <div className="city-marker" style={{ backgroundColor: getPlayer(entities.buildings.find(b => b.TypeId === 'city').playerId)?.color }}></div>
      )}
      
      {cellData.resources?.length > 0 && (
          <div className="resource-container">
              {cellData.resources.map((resTypeId, index) => (
                  <img key={index} src={getResourceTexture(resTypeId)} alt={resTypeId} className="resource-icon" />
              ))}
          </div>
      )}
    </div>
  );
};

export default Cell;