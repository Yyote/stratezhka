import React, { createContext, useState, useCallback, useContext } from 'react';
import JSZip from 'jszip';
import { ResourceSetContext } from './ResourceSetContext';
import { ResearchSetContext } from './ResearchSetContext';

export const UnitsetContext = createContext();

const DEFAULT_UNITSET = { name: "None", units: [] };

export const UnitsetProvider = ({ children }) => {
  const [unitSet, setUnitSet] = useState(DEFAULT_UNITSET);
  const { loadResourceSetFromZip } = useContext(ResourceSetContext);
  const { loadResearchSetFromZip } = useContext(ResearchSetContext);

  const loadUnitsetFromZip = useCallback(async (zipFile) => {
    try {
      const zip = await JSZip.loadAsync(zipFile);
      
      const resourceSetFile = zip.file("resourceset.szrs");
      if (resourceSetFile) {
        await loadResourceSetFromZip(await resourceSetFile.async("blob"));
      } else {
        throw new Error("Archive is missing its dependency: resourceset.szrs");
      }
      
      const researchSetFile = zip.file("researchset.szrsh");
      if (researchSetFile) {
          await loadResearchSetFromZip(await researchSetFile.async("blob"));
      } else {
          throw new Error("Archive is missing its dependency: researchset.szrsh");
      }

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