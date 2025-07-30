import React, { createContext, useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import defaultGrassPath from '../assets/textures/grass.png';
import defaultWaterPath from '../assets/textures/water.png';
import defaultMountainPath from '../assets/textures/mountain.png';
// DO NOT import component-specific CSS here

export const TilesetContext = createContext();

export const TilesetProvider = ({ children }) => {
  const [tileset, setTileset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const initializeDefaultTileset = useCallback(async () => {
    try {
      const defaultTiles = [
        { name: "grass", path: defaultGrassPath, props: { land_passable: true, air_passable: true, overwater_passable: false, underwater_passable: false } },
        { name: "water", path: defaultWaterPath, props: { land_passable: false, air_passable: true, overwater_passable: true, underwater_passable: true } },
        { name: "mountain", path: defaultMountainPath, props: { land_passable: false, air_passable: true, overwater_passable: false, underwater_passable: false } }
      ];
      const processedTiles = await Promise.all(
        defaultTiles.map(async (tileInfo) => {
          const response = await fetch(tileInfo.path);
          const blob = await response.blob();
          return { type_name: tileInfo.name, texture_path: `${tileInfo.name}.png`, ...tileInfo.props, textureUrl: URL.createObjectURL(blob), textureBlob: blob };
        })
      );
      return { name: "Default", tiles: processedTiles };
    } catch (error) {
      console.error("Failed to initialize default tileset:", error);
      return { name: "Error", tiles: [] };
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      const defaultTileset = await initializeDefaultTileset();
      setTileset(defaultTileset);
      setIsLoading(false);
    };
    loadInitialData();
  }, [initializeDefaultTileset]);

  const loadTilesetFromZip = useCallback(async (zipFile) => {
    try {
      const zip = await JSZip.loadAsync(zipFile);
      const manifestFile = zip.file("manifest.json");
      if (!manifestFile) throw new Error("manifest.json not found in tileset.");
      const manifest = JSON.parse(await manifestFile.async("string"));
      const tilesWithData = await Promise.all(
        manifest.tiles.map(async (tile) => {
          const textureFile = zip.file(`assets/textures/${tile.texture_path}`);
          let textureUrl = null, textureBlob = null;
          if (textureFile) {
            textureBlob = await textureFile.async("blob");
            textureUrl = URL.createObjectURL(textureBlob);
          }
          return { ...tile, textureUrl, textureBlob };
        })
      );
      const newTileset = { name: manifest.name, tiles: tilesWithData };
      setTileset(newTileset);
      return newTileset;
    } catch (error) {
      alert(`Failed to load tileset: ${error.message}`);
      return null;
    }
  }, []);

  const resetToDefault = useCallback(async () => {
    setIsLoading(true);
    const defaultTileset = await initializeDefaultTileset();
    setTileset(defaultTileset);
    setIsLoading(false);
  }, [initializeDefaultTileset]);
  
  const value = { tileset, isLoading, loadTilesetFromZip, resetToDefault };

  return (
    <TilesetContext.Provider value={value}>{children}</TilesetContext.Provider>
  );
};