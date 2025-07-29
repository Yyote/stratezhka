import React, { useState, useContext } from 'react';
import MainMenu from './components/MainMenu/MainMenu';
import MapEditor from './components/MapEditor/MapEditor';
import Game from './components/Game/Game';
import TilesetCreator from './components/TilesetCreator/TilesetCreator';
import ResourceCreator from './components/ResourceCreator/ResourceCreator';
import ResearchCreator from './components/ResearchCreator/ResearchCreator';
import GameSetup from './components/GameSetup/GameSetup';
import { TilesetProvider, TilesetContext } from './context/TilesetContext';
import { NotificationProvider } from './context/NotificationContext';
import { ResourceSetProvider } from './context/ResourceSetContext';
import './App.css';

const AppContent = () => {
  const [mode, setMode] = useState('main_menu');
  const [mapData, setMapData] = useState(null);
  const [gameSettings, setGameSettings] = useState(null);
  const { isLoading: isTilesetLoading, resetToDefault: resetTileset } = useContext(TilesetContext);

  const handleStartHotseatSetup = () => { setMode('setup'); };
  const handleCompleteSetup = (players) => { setGameSettings({ players }); setMode('main_menu'); };
  
  const handleStartGameWithMap = (loadedMapData) => {
    setMapData(loadedMapData);
    setMode('playing');
  };

  const handleReturnToMenu = async () => {
    setMode('main_menu');
    setMapData(null);
    setGameSettings(null);
    await resetTileset(); // Reset the global tileset
  };

  if (isTilesetLoading) {
    return <div className="loading-screen"><h1>Loading Assets...</h1></div>;
  }
  
  switch (mode) {
    case 'setup': return <GameSetup onStartGame={handleCompleteSetup} />;
    case 'editor': return <MapEditor onReturnToMenu={handleReturnToMenu} />;
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
    case 'tileset_creator': return <TilesetCreator onReturnToMenu={handleReturnToMenu} />;
    case 'resource_creator': return <ResourceCreator onReturnToMenu={handleReturnToMenu} />;
    case 'research_creator': return <ResearchCreator onReturnToMenu={handleReturnToMenu} />;
    case 'main_menu':
    default:
      return <MainMenu onStartHotseat={handleStartHotseatSetup} onStartGameWithMap={handleStartGameWithMap} setMode={setMode} isAwaitingMap={!!gameSettings} />;
  }
};

function App() {
  return (
    <NotificationProvider>
      <TilesetProvider>
        <ResourceSetProvider>
          <div className="App">
            <AppContent />
          </div>
        </ResourceSetProvider>
      </TilesetProvider>
    </NotificationProvider>
  );
}

export default App;