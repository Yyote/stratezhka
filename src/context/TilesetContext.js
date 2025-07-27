import React, { createContext, useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';

// Import default textures to get their paths for the initial fetch
import defaultGrassPath from '../assets/textures/grass.png';
import defaultWaterPath from '../assets/textures/water.png';
import defaultMountainPath from '../assets/textures/mountain.png';

export const TilesetContext = createContext();

export const TilesetProvider = ({ children }) => {
  const [tileset, setTileset] = useState(null); // Default to null while initializing
  const [isLoading, setIsLoading] = useState(true); // Start in a loading state

  // Function to initialize the default tileset with blobs
  useEffect(() => {
    const initializeDefaultTileset = async () => {
      try {
        const defaultTiles = [
          { name: "grass", path: defaultGrassPath, props: { ground_passable: true, air_passable: true, water_passable: false } },
          { name: "water", path: defaultWaterPath, props: { ground_passable: false, air_passable: true, water_passable: true } },
          { name: "mountain", path: defaultMountainPath, props: { ground_passable: false, air_passable: true, water_passable: false } }
        ];

        const processedTiles = await Promise.all(
          defaultTiles.map(async (tileInfo) => {
            const response = await fetch(tileInfo.path);
            const blob = await response.blob();
            return {
              type_name: tileInfo.name,
              texture_path: `${tileInfo.name}.png`,
              ...tileInfo.props,
              textureUrl: URL.createObjectURL(blob),
              textureBlob: blob,
            };
          })
        );
        
        setTileset({ name: "Default", tiles: processedTiles });
      } catch (error) {
        console.error("Failed to initialize default tileset:", error);
        // Set an empty tileset on failure
        setTileset({ name: "Error", tiles: [] });
      } finally {
        setIsLoading(false);
      }
    };

    initializeDefaultTileset();
  }, []);


  const loadTilesetFromZip = useCallback(async (zipFile) => {
    setIsLoading(true);
    try {
      const zip = await JSZip.loadAsync(zipFile);
      const manifestFile = zip.file("manifest.json");

      if (!manifestFile) throw new Error("manifest.json not found in tileset.");

      const manifestContent = await manifestFile.async("string");
      const manifest = JSON.parse(manifestContent);

      const tilesWithData = await Promise.all(
        manifest.tiles.map(async (tile) => {
          const textureFile = zip.file(`assets/textures/${tile.texture_path}`);
          if (!textureFile) {
            console.warn(`Texture ${tile.texture_path} not found`);
            return { ...tile, textureUrl: null, textureBlob: null };
          }
          const blob = await textureFile.async("blob");
          const textureUrl = URL.createObjectURL(blob);
          return { ...tile, textureUrl, textureBlob: blob };
        })
      );
      
      setTileset({ name: manifest.name, tiles: tilesWithData });

    } catch (error) {
      alert(`Failed to load tileset: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const value = { tileset, isLoading, loadTilesetFromZip };

  return (
    <TilesetContext.Provider value={value}>{children}</TilesetContext.Provider>
  );
};
