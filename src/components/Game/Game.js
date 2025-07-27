import React, { useMemo } from 'react';
import GameGrid from '../GameGrid/GameGrid';

// It's good practice to have the texture mapping available here too
import grassTexture from '../../assets/textures/grass.png';
import waterTexture from '../../assets/textures/water.png';
import mountainTexture from '../../assets/textures/mountain.png';

const TILE_TYPES = {
  grass: { texture: grassTexture },
  water: { texture: waterTexture },
  mountain: { texture: mountainTexture },
};

const Game = ({ mapData, onReturnToMenu }) => {
  // Convert the string grid from the map file into a texture grid for rendering
  const textureGrid = useMemo(() => {
    if (!mapData || !mapData.grid) return [];
    return mapData.grid.map(row =>
      row.map(tileType => ({ texture: TILE_TYPES[tileType]?.texture || grassTexture }))
    );
  }, [mapData]);

  if (!mapData) {
    return (
      <div>
        <h2>Error: No map data loaded.</h2>
        <button onClick={onReturnToMenu}>Return to Main Menu</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Playing: {mapData.name}</h1>
      <GameGrid gridData={textureGrid} editorMode={false} />
      <button style={{ marginTop: '20px' }} onClick={onReturnToMenu}>
        Exit to Main Menu
      </button>
    </div>
  );
};

export default Game;
