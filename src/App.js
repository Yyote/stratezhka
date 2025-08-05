import React, { useState, useContext } from 'react';
import MainMenu from './components/MainMenu/MainMenu';
import MapEditor from './components/MapEditor/MapEditor';
import Game from './components/Game/Game';
import TilesetCreator from './components/TilesetCreator/TilesetCreator';
import ResourceCreator from './components/ResourceCreator/ResourceCreator';
import ResearchCreator from './components/ResearchCreator/ResearchCreator';
import UnitsetCreator from './components/UnitsetCreator/UnitsetCreator';
import BuildingsetCreator from './components/BuildingsetCreator/BuildingsetCreator';
import GameSetup from './components/GameSetup/GameSetup';
import { TilesetProvider, TilesetContext } from './context/TilesetContext';
import { NotificationProvider } from './context/NotificationContext';
import { ResourceSetProvider } from './context/ResourceSetContext';
import { ResearchSetProvider } from './context/ResearchSetContext';
import { UnitsetProvider } from './context/UnitsetContext';
import { BuildingsetProvider } from './context/BuildingsetContext';
import './App.css';

const AppContent = () => {
  const [mode, setMode] = useState('main_menu');
  const [mapData, setMapData] = useState(null);
  const [gameSettings, setGameSettings] = useState(null);
  const { isLoading: isTilesetLoading, resetToDefault: resetTileset } = useContext(TilesetContext);

  // State to hold the fully loaded resource set
  const [loadedResourceSet, setLoadedResourceSet] = useState(null);

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
    setLoadedResourceSet(null); // Clear the loaded set on return
    await resetTileset();
  };

  if (isTilesetLoading) {
    return <div className="loading-screen"><h1>Loading Assets...</h1></div>;
  }
  
  switch (mode) {
    case 'setup': return <GameSetup onStartGame={handleCompleteSetup} />;
    // Pass the loaded resource set as a prop
    case 'editor': return <MapEditor onReturnToMenu={handleReturnToMenu} resourceSet={loadedResourceSet} />;
    case 'playing':
      if (!mapData || !gameSettings) {
        return ( <div className="loading-screen"> <h1>Error: Game started with incomplete settings.</h1> <button onClick={handleReturnToMenu}>Return to Menu</button> </div> );
      }
      return <Game mapData={mapData} gameSettings={gameSettings} onReturnToMenu={handleReturnToMenu} />;
    case 'tileset_creator': return <TilesetCreator onReturnToMenu={handleReturnToMenu} />;
    // Pass the loaded resource set as a prop
    case 'resource_creator': return <ResourceCreator onReturnToMenu={handleReturnToMenu} resourceSetProp={loadedResourceSet} />;
    case 'research_creator': return <ResearchCreator onReturnToMenu={handleReturnToMenu} />;
    case 'unitset_creator': return <UnitsetCreator onReturnToMenu={handleReturnToMenu} />;
    case 'buildingset_creator': return <BuildingsetCreator onReturnToMenu={handleReturnToMenu} />;
    case 'main_menu':
    default:
      // Pass the setter function to the main menu
      return <MainMenu onStartHotseat={handleStartHotseatSetup} onStartGameWithMap={handleStartGameWithMap} setMode={setMode} isAwaitingMap={!!gameSettings} onResourceSetLoaded={setLoadedResourceSet} />;
  }
};

function App() {
  return (
    <NotificationProvider>
      <TilesetProvider>
        <ResourceSetProvider>
          <ResearchSetProvider>
            <UnitsetProvider>
              <BuildingsetProvider>
                <div className="App">
                  <AppContent />
                </div>
              </BuildingsetProvider>
            </UnitsetProvider>
          </ResearchSetProvider>
        </ResourceSetProvider>
      </TilesetProvider>
    </NotificationProvider>
  );
}

export default App;