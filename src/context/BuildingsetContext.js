import React, { createContext, useState, useCallback, useContext } from 'react';
import JSZip from 'jszip';
import { ResourceSetContext } from './ResourceSetContext';
import { UnitsetContext } from './UnitsetContext';
import { ResearchSetContext } from './ResearchSetContext';

export const BuildingsetContext = createContext();

const DEFAULT_BUILDINGSET = { name: "None", buildings: [] };

export const BuildingsetProvider = ({ children }) => {
  const [buildingSet, setBuildingSet] = useState(DEFAULT_BUILDINGSET);
  const { loadResourceSetFromZip } = useContext(ResourceSetContext);
  const { loadUnitsetFromZip } = useContext(UnitsetContext);
  const { loadResearchSetFromZip } = useContext(ResearchSetContext);

  const loadBuildingsetFromZip = useCallback(async (zipFile) => {
    try {
      const zip = await JSZip.loadAsync(zipFile);
      
      const resourceSetFile = zip.file("resourceset.szrs");
      if(resourceSetFile) await loadResourceSetFromZip(await resourceSetFile.async("blob"));
      else throw new Error("Archive missing dependency: resourceset.szrs");

      const unitSetFile = zip.file("unitset.szus");
      if(unitSetFile) await loadUnitsetFromZip(await unitSetFile.async("blob"));
      else throw new Error("Archive missing dependency: unitset.szus");

      const researchSetFile = zip.file("researchset.szrsh");
      if(researchSetFile) {
          await loadResearchSetFromZip(await researchSetFile.async("blob"));
      } else {
          throw new Error("Archive missing dependency: researchset.szrsh");
      }

      const manifestFile = zip.file("manifest.json");
      if (!manifestFile) throw new Error("manifest.json not found in building set.");
      const manifest = JSON.parse(await manifestFile.async("string"));
      
      setBuildingSet({ name: manifest.name, buildings: manifest.buildings || [] });

    } catch (error) {
      alert(`Failed to load building set: ${error.message}`);
    }
  }, [loadResourceSetFromZip, loadUnitsetFromZip, loadResearchSetFromZip]);

  const value = { buildingSet, setBuildingSet, loadBuildingsetFromZip };

  return (
    <BuildingsetContext.Provider value={value}>{children}</BuildingsetContext.Provider>
  );
};