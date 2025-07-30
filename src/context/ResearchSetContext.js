import React, { createContext, useState, useCallback, useContext } from 'react';
import JSZip from 'jszip';
import { ResourceSetContext } from './ResourceSetContext';

export const ResearchSetContext = createContext();

const DEFAULT_RESEARCHSET = { name: "None", researches: [] };

export const ResearchSetProvider = ({ children }) => {
  const [researchSet, setResearchSet] = useState(DEFAULT_RESEARCHSET);
  const { loadResourceSetFromZip } = useContext(ResourceSetContext);

  const loadResearchSetFromZip = useCallback(async (zipFile) => {
    try {
      const zip = await JSZip.loadAsync(zipFile);
      
      const resourceSetFile = zip.file("resourceset.szrs");
      if (resourceSetFile) {
        const blob = await resourceSetFile.async("blob");
        await loadResourceSetFromZip(blob);
      } else {
        throw new Error("Archive is missing its dependency: resourceset.szrs");
      }

      const manifestFile = zip.file("manifest.json");
      if (!manifestFile) throw new Error("manifest.json not found in research set.");
      const manifest = JSON.parse(await manifestFile.async("string"));
      
      setResearchSet({ name: manifest.name, researches: manifest.researches || [] });
      alert(`Research Set "${manifest.name}" loaded successfully!`);

    } catch (error) {
      alert(`Failed to load research set: ${error.message}`);
    }
  }, [loadResourceSetFromZip]);

  const value = { researchSet, setResearchSet, loadResearchSetFromZip };

  return (
    <ResearchSetContext.Provider value={value}>{children}</ResearchSetContext.Provider>
  );
};