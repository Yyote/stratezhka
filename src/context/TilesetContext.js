import React, { createContext } from 'react';
import JSZip from 'jszip';

// Import default textures for the initialization helper
import defaultGrassPath from '../assets/textures/grass.png';
import defaultWaterPath from '../assets/textures/water.png';
import defaultMountainPath from '../assets/textures/mountain.png';

export const TilesetContext = createContext();

/**
 * UTILITY FUNCTION: Initializes the default tileset by fetching local assets.
 * This is now an exportable helper function, not tied to the provider's state.
 */
export const initializeDefaultTileset = async () => {
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
    
    return { name: "Default", tiles: processedTiles };
  } catch (error) {
    console.error("Failed to initialize default tileset:", error);
    return { name: "Error", tiles: [] }; // Return an empty but valid object on failure
  }
};

/**
 * UTILITY FUNCTION: Loads a tileset from a .szts blob.
 * Returns the new tileset data instead of setting state directly.
 */
export const loadTilesetFromZip = async (zipFile) => {
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
    
    return { name: manifest.name, tiles: tilesWithData };
  } catch (error) {
    alert(`Failed to load tileset: ${error.message}`);
    throw error; // Re-throw the error so the caller can handle it
  }
};
