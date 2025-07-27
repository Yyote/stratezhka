import React, { useState, useEffect, useContext } from 'react';
import MainMenu from './components/MainMenu/MainMenu';
import MapEditor from './components/MapEditor/MapEditor';
import Game from './components/Game/Game';
import TilesetCreator from './components/TilesetCreator/TilesetCreator';
import GameSetup from './components/GameSetup/GameSetup';
import { TilesetProvider, TilesetContext, initializeDefaultTileset } from './context/TilesetContext';
import { NotificationProvider } from './context/NotificationContext';
import './App.css';

function App() {
  const [mode, setMode] = useState('main_menu');
  const [mapData, setMapData] = useState(null);
  const [tileset, setTileset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameSettings, setGameSettings] = useState(null); // { playerCount: number } | null

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
  
  // This function is called from GameSetup
  const handleCompleteSetup = (playerCount) => {
    setGameSettings({ playerCount });
    // THE FIX: Go back to the main menu, which will now be in a "select map" state
    setMode('main_menu'); 
  };

  // This function is called from MainMenu after a map is selected
  const handleStartGameWithMap = (loadedMapData, loadedTileset) => {
    setMapData(loadedMapData);
    setTileset(loadedTileset);
    setMode('playing');
  };

  const handleReturnToMenu = async () => {
    setIsLoading(true);
    setMode('main_menu');
    setMapData(null);
    setGameSettings(null); // Reset game settings
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
        // Ensure both map and settings are ready before starting game
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
      case 'main_menu':
      default:
        return <MainMenu 
            onStartHotseat={handleStartHotseatSetup} 
            onStartGameWithMap={handleStartGameWithMap} 
            setMode={setMode} 
            setTileset={setTileset}
            // Let the main menu know if it should be asking for a map
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
