import React, { createContext, useState, useCallback } from 'react';
import JSZip from 'jszip';

export const ResourceSetContext = createContext();

const DEFAULT_RESOURCESET = {
  name: "None",
  resources: [],
};

export const ResourceSetProvider = ({ children }) => {
  const [resourceSet, setResourceSet] = useState(DEFAULT_RESOURCESET);

  const loadResourceSetFromZip = useCallback(async (zipFile) => {
    try {
      const zip = await JSZip.loadAsync(zipFile);
      const manifestFile = zip.file("manifest.json");
      if (!manifestFile) {
        throw new Error("manifest.json not found in the resource set file.");
      }

      const manifestContent = await manifestFile.async("string");
      const manifest = JSON.parse(manifestContent);

      const resourcesWithData = await Promise.all(
        (manifest.resources || []).map(async (resData) => {
          let textureUrl = null;
          let textureBlob = null;
          if (resData.texture_path) {
              const fullPath = `assets/textures/${resData.texture_path}`;
              const textureFile = zip.file(fullPath);
              if (textureFile) {
                  textureBlob = await textureFile.async("blob");
                  textureUrl = URL.createObjectURL(textureBlob);
              }
          }
          return { ...resData, textureUrl, textureBlob };
        })
      );
      
      const newResourceSet = { name: manifest.name, resources: resourcesWithData };
      setResourceSet(newResourceSet); // Update the context for other consumers
      return newResourceSet; // Return the fully processed object

    } catch (error) {
      alert(`Failed to load resource set: ${error.message}`);
      return null; // Return null on failure
    }
  }, []);

  const value = { resourceSet, loadResourceSetFromZip, setResourceSet };

  return (
    <ResourceSetContext.Provider value={value}>{children}</ResourceSetContext.Provider>
  );
};