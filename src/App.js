import React, { useState, useEffect, useContext } from 'react';
import MainMenu from './components/MainMenu/MainMenu';
import MapEditor from './components/MapEditor/MapEditor';
import Game from './components/Game/Game';
import TilesetCreator from './components/TilesetCreator/TilesetCreator';
import { TilesetProvider, TilesetContext, initializeDefaultTileset } from './context/TilesetContext';
import { NotificationProvider } from './context/NotificationContext';
import './App.css';

function App() {
  const [mode, setMode] = useState('main_menu');
  const [mapData, setMapData] = useState(null);
  const [tileset, setTileset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load the default tileset on initial app load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      const defaultTileset = await initializeDefaultTileset();
      setTileset(defaultTileset);
      setIsLoading(false);
    };
    loadInitialData();
  }, []);

  const handleStartGame = (loadedMapData, loadedTileset) => {
    setMapData(loadedMapData);
    setTileset(loadedTileset);
    setMode('playing');
  };

  const handleReturnToMenu = async () => {
    setIsLoading(true);
    setMode('main_menu');
    setMapData(null);
    const defaultTileset = await initializeDefaultTileset();
    setTileset(defaultTileset);
    setIsLoading(false);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return <div className="loading-screen"><h1>Loading...</h1></div>;
    }
    
    switch (mode) {
      case 'editor':
        return <MapEditor onReturnToMenu={handleReturnToMenu} />;
      case 'playing':
        // ==========================================================
        // THE FIX: Correct the typo from onReturnTouMenu to onReturnToMenu
        // ==========================================================
        return <Game mapData={mapData} onReturnToMenu={handleReturnToMenu} />;
      case 'tileset_creator':
        return <TilesetCreator onReturnToMenu={handleReturnToMenu} />;
      case 'main_menu':
      default:
        return <MainMenu onStartGame={handleStartGame} setMode={setMode} setTileset={setTileset} />;
    }
  };

  const contextValue = { tileset, isLoading };

  return (
    <NotificationProvider>
      <TilesetContext.Provider value={contextValue}>
        <div className="App">
          {renderContent()}
        </div>
      </TilesetContext.Provider>
    </NotificationProvider>
  );
}

export default App;
