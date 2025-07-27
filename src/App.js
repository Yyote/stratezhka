import React, { useState, useContext } from 'react';
import MainMenu from './components/MainMenu/MainMenu';
import MapEditor from './components/MapEditor/MapEditor';
import Game from './components/Game/Game';
import TilesetCreator from './components/TilesetCreator/TilesetCreator';
import { TilesetProvider, TilesetContext } from './context/TilesetContext';
import './App.css';

// Create a new inner component to access the context
const AppContent = () => {
  const [mode, setMode] = useState('main_menu');
  const [mapData, setMapData] = useState(null);
  const { isLoading: isTilesetLoading } = useContext(TilesetContext); // Get loading state

  const handleStartGame = (loadedMapData) => {
    setMapData(loadedMapData);
    setMode('playing');
  };

  const handleReturnToMenu = () => {
    setMode('main_menu');
  };

  // Show a global loading screen if the tileset isn't ready
  if (isTilesetLoading) {
    return <div className="loading-screen"><h1>Loading Assets...</h1></div>;
  }

  switch (mode) {
    case 'editor':
      return <MapEditor onReturnToMenu={handleReturnToMenu} />;
    case 'playing':
      return <Game mapData={mapData} onReturnToMenu={handleReturnToMenu} />;
    case 'tileset_creator':
      return <TilesetCreator onReturnToMenu={handleReturnToMenu} />;
    case 'main_menu':
    default:
      return <MainMenu onStartGame={handleStartGame} setMode={setMode} />;
  }
}

function App() {
  return (
    <TilesetProvider>
      <div className="App">
        <AppContent />
      </div>
    </TilesetProvider>
  );
}

export default App;
