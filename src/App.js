import React, { useState, useEffect, useContext } from 'react';
import MainMenu from './components/MainMenu/MainMenu';
import MapEditor from './components/MapEditor/MapEditor';
import Game from './components/Game/Game';
import TilesetCreator from './components/TilesetCreator/TilesetCreator';
import GameSetup from './components/GameSetup/GameSetup';
import { TilesetProvider, TilesetContext, initializeDefaultTileset } from './context/TilesetContext';
import { NotificationProvider } from './context/NotificationContext';
import ResourceCreator from './components/ResourceCreator/ResourceCreator'; // <-- NEW

import './App.css';

function App() {
  const [mode, setMode] = useState('main_menu');
  const [mapData, setMapData] = useState(null);
  const [tileset, setTileset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameSettings, setGameSettings] = useState(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      const defaultTileset = await initializeDefaultTileset();
      setTileset(defaultTileset);
      setIsLoading(false);
    };
    loadInitialData();
  }, []);

  const handleStartHotseatSetup = () => {
    setMode('setup');
  };
  
  const handleCompleteSetup = (players) => {
    setGameSettings({ players });
    setMode('main_menu');
  };

  const handleStartGameWithMap = (loadedMapData, loadedTileset) => {
    setMapData(loadedMapData);
    setTileset(loadedTileset);
    setMode('playing');
  };

  const handleReturnToMenu = async () => {
    setIsLoading(true);
    setMode('main_menu');
    setMapData(null);
    setGameSettings(null);
    const defaultTileset = await initializeDefaultTileset();
    setTileset(defaultTileset);
    setIsLoading(false);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return <div className="loading-screen"><h1>Loading...</h1></div>;
    }
    
    switch (mode) {
      case 'setup':
        return <GameSetup onStartGame={handleCompleteSetup} />;
      case 'editor':
        return <MapEditor onReturnToMenu={handleReturnToMenu} />;
      case 'playing':
        if (!mapData || !gameSettings) {
            return (
                <div className="loading-screen">
                    <h1>Error: Game started with incomplete settings.</h1>
                    <button onClick={handleReturnToMenu}>Return to Menu</button>
                </div>
            );
        }
        return <Game mapData={mapData} gameSettings={gameSettings} onReturnToMenu={handleReturnToMenu} />;
      case 'tileset_creator':
        return <TilesetCreator onReturnToMenu={handleReturnToMenu} />;
      case 'resource_creator': // <-- NEW
        return <ResourceCreator onReturnToMenu={handleReturnToMenu} />;

      case 'main_menu':
      default:
        return <MainMenu 
            onStartHotseat={handleStartHotseatSetup} 
            onStartGameWithMap={handleStartGameWithMap} 
            setMode={setMode} 
            setTileset={setTileset}
            isAwaitingMap={!!gameSettings}
        />;
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
