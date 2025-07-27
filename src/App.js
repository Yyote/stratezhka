import React, { useState } from 'react';
import MainMenu from './components/MainMenu/MainMenu';
import MapEditor from './components/MapEditor/MapEditor';
import Game from './components/Game/Game';
import './App.css';

function App() {
  const [mode, setMode] = useState('main_menu'); // 'main_menu', 'editor', 'playing'
  const [mapData, setMapData] = useState(null);

  // Function to start the game with loaded map data
  const handleStartGame = (loadedMapData) => {
    setMapData(loadedMapData);
    setMode('playing');
  };

  // Function to switch to the map editor
  const handleGoToEditor = () => {
    setMode('editor');
  };

  // Function to return to the main menu from another mode
  const handleReturnToMenu = () => {
    setMode('main_menu');
  };

  const renderContent = () => {
    switch (mode) {
      case 'editor':
        return <MapEditor onReturnToMenu={handleReturnToMenu} />;
      case 'playing':
        return <Game mapData={mapData} onReturnToMenu={handleReturnToMenu} />;
      case 'main_menu':
      default:
        return <MainMenu onStartGame={handleStartGame} onCreateMap={handleGoToEditor} />;
    }
  };

  return (
    <div className="App">
      {renderContent()}
    </div>
  );
}

export default App;
