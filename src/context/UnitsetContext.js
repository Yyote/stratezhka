import React, { createContext, useState, useCallback, useContext } from 'react';
import JSZip from 'jszip';
import { ResourceSetContext } from './ResourceSetContext';
import { ResearchSetContext } from './ResearchSetContext'; // Import new dependency

export const UnitsetContext = createContext();

const DEFAULT_UNITSET = { name: "None", units: [] };

export const UnitsetProvider = ({ children }) => {
  const [unitSet, setUnitSet] = useState(DEFAULT_UNITSET);
  const { loadResourceSetFromZip } = useContext(ResourceSetContext);
  const { loadResearchSetFromZip } = useContext(ResearchSetContext); // Get the loader from the new context

  const loadUnitsetFromZip = useCallback(async (zipFile) => {
    try {
      const zip = await JSZip.loadAsync(zipFile);
      
      // Load dependencies first
      const resourceSetFile = zip.file("resourceset.szrs");
      if (resourceSetFile) {
        await loadResourceSetFromZip(await resourceSetFile.async("blob"));
      } else {
        throw new Error("Archive is missing its dependency: resourceset.szrs");
      }
      
      // THE FIX: Load the research set dependency
      const researchSetFile = zip.file("researchset.szrsh");
      if (researchSetFile) {
          await loadResearchSetFromZip(await researchSetFile.async("blob"));
      } else {
          throw new Error("Archive is missing its dependency: researchset.szrsh");
      }

      // Load the unitset manifest
      const manifestFile = zip.file("manifest.json");
      if (!manifestFile) throw new Error("manifest.json not found in unit set.");
      const manifest = JSON.parse(await manifestFile.async("string"));
      
      setUnitSet({ name: manifest.name, units: manifest.units || [] });

    } catch (error) {
      alert(`Failed to load unit set: ${error.message}`);
    }
  }, [loadResourceSetFromZip, loadResearchSetFromZip]);

  const value = { unitSet, setUnitSet, loadUnitsetFromZip };

  return (
    <UnitsetContext.Provider value={value}>{children}</UnitsetContext.Provider>
  );
};