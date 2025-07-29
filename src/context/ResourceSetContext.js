import React, { createContext, useState, useCallback } from 'react';
import JSZip from 'jszip';

export const ResourceSetContext = createContext();

// A default empty set to prevent the app from crashing before one is loaded.
const DEFAULT_RESOURCESET = {
  name: "None",
  resources: [],
};

export const ResourceSetProvider = ({ children }) => {
  const [resourceSet, setResourceSet] = useState(DEFAULT_RESOURCESET);
  const [isLoading, setIsLoading] = useState(false);

  const loadResourceSetFromZip = useCallback(async (zipFile) => {
    setIsLoading(true);
    try {
      const zip = await JSZip.loadAsync(zipFile);
      const manifestFile = zip.file("manifest.json");

      if (!manifestFile) {
        throw new Error("manifest.json not found in the resource set file.");
      }

      const manifestContent = await manifestFile.async("string");
      const manifest = JSON.parse(manifestContent);

      // We don't need texture blobs here, just the manifest data.
      // Other creators that depend on this will use the data.
      setResourceSet({ name: manifest.name, resources: manifest.resources || [] });

    } catch (error) {
      alert(`Failed to load resource set: ${error.message}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = { resourceSet, isLoading, loadResourceSetFromZip, setResourceSet };

  return (
    <ResourceSetContext.Provider value={value}>{children}</ResourceSetContext.Provider>
  );
};