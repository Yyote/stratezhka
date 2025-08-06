import { Unit } from './Unit';
import { Building } from './Building';

const CORE_CITY_TEMPLATE = {
    TypeId: 'city',
    name: 'City',
    texture_path: "",
    requiresResearch: [],
    land_positioned: true,
    air_positioned: false,
    overwater_positioned: false,
    underwater_positioned: false,
    shallow_water_positioned: false,
    canBuild: [],
    cost: [],
    build_time: 1,
    attack: 0,
    defense: 10,
    max_hp: 100,
    gives_attack_bonus: 0,
    gives_defense_bonus: 1,
    can_research: [],
    canMine: true,
    converts: [],
    isRoad: false,
    consumes_action_override: 0,
    alreadyBuiltCostModifier: 1.5,
};


export class GameEngine {
    constructor(mapData, gameSettings, tileset, resourceSet, researchSet, unitSet, buildingSet) {
        // --- Static Data ---
        this.tileset = tileset;
        this.resourceSet = resourceSet;
        this.researchSet = researchSet;
        this.unitSet = unitSet;
        this.buildingSet = buildingSet;
        
        // --- Dynamic Game State ---
        this.map = JSON.parse(JSON.stringify(mapData)); // Deep copy to prevent mutation
        this.players = this.initializePlayers(gameSettings, resourceSet);
        this.units = [];
        this.buildings = []; // This replaces the old 'cities' array
        this.turn = 1;
        this.currentPlayerId = 0;
        this.gamePhase = 'SETUP'; // SETUP, PLANNING, EXECUTING
    }

    initializePlayers(gameSettings, resourceSet) {
        const initialResources = resourceSet.resources.reduce((acc, res) => ({...acc, [res.TypeId]: 0}), {});
        const playerColors = this.generatePlayerColors(gameSettings.players.length);
        
        return gameSettings.players.map((player, i) => ({
            ...player,
            color: playerColors[i],
            isTurnFinished: false,
            resources: { ...initialResources },
            completedResearch: [],
        }));
    }
    
    // --- Public API for Actions ---

    placeBuilding(playerId, buildingTypeId, row, col) {
        const player = this.players.find(p => p.id === playerId);
        const buildingTemplate = this.buildingSet.buildings.find(b => b.TypeId === buildingTypeId);
        if (!buildingTemplate) return { error: "Building type not found." };
        
        // --- NEW: Affordability Check ---
        for (const cost of buildingTemplate.cost) {
            if (player.resources[cost.resourceTypeId] < cost.amount) {
                return { error: `Not enough resources. Need ${cost.amount} ${cost.resourceTypeId}.` };
            }
        }

        const cell = this.map.grid[row][col];
        const tile = this.tileset.tiles.find(t => t.type_name === cell.tile);
        const buildingsOnCell = this.buildings.filter(b => b.pos.row === row && b.pos.col === col);
        
        // --- Rule 1: Ownership and Road Adjacency ---
        if (buildingTemplate.isRoad) {
            const friendlyBuildings = this.buildings.filter(b => b.playerId === playerId && (b.TypeId === 'city' || b.isRoad));
            const isAdjacentToFriendly = friendlyBuildings.some(b => 
                Math.abs(b.pos.row - row) <= 1 && Math.abs(b.pos.col - col) <= 1
            );
            if (!isAdjacentToFriendly) {
                return { error: "Roads must be built adjacent to a city or another road." };
            }
        } else if (buildingTypeId !== 'city') {
            const playerBuildingsOnCell = buildingsOnCell.filter(b => b.playerId === playerId);
            if (playerBuildingsOnCell.length === 0) {
                return { error: "You must own a building on this tile to build here." };
            }
        }
        
        // --- Rule 2: Non-Strict Terrain Match ---
        let isPlacementValid = false;
        if (buildingTemplate.land_positioned && tile.land_passable) isPlacementValid = true;
        if (buildingTemplate.overwater_positioned && tile.overwater_passable) isPlacementValid = true;
        if (buildingTemplate.underwater_positioned && tile.underwater_passable) isPlacementValid = true;
        if (buildingTemplate.shallow_water_positioned && tile.shallow_water_passable) isPlacementValid = true;
        
        if (!isPlacementValid) {
            return { error: "This building cannot be placed on this terrain type." };
        }

        // --- Rule 3 & 4: Stacking Logic ---
        const hasCity = buildingsOnCell.some(b => b.TypeId === 'city');
        const hasRoad = buildingsOnCell.some(b => b.isRoad);
        const hasOtherBuilding = buildingsOnCell.some(b => b.TypeId !== 'city' && !b.isRoad);
        
        if (buildingTemplate.TypeId === 'city' && hasCity) return { error: "Cannot build a city on another city."};
        if (buildingTemplate.isRoad && hasRoad) return { error: "Cannot build a road on another road."};
        if (!buildingTemplate.isRoad && buildingTemplate.TypeId !== 'city' && hasOtherBuilding) return { error: "Only one non-road building is allowed per tile."};


        // --- NEW: Deduct Resources ---
        const newResources = { ...player.resources };
        for (const cost of buildingTemplate.cost) {
            newResources[cost.resourceTypeId] -= cost.amount;
        }
        this.players = this.players.map(p => p.id === playerId ? { ...p, resources: newResources } : p);


        const newBuilding = new Building(buildingTypeId, playerId, row, col, buildingTemplate);
        this.buildings = [...this.buildings, newBuilding];
        
        return this.getState();
    }

    placeStartingCity(row, col) {
        if (this.gamePhase !== 'SETUP') return { error: "Not in the setup phase." };
        if (this.buildings.some(b => b.pos.row === row && b.pos.col === col)) {
            return { error: "A building already exists here." };
        }

        const cityTemplate = CORE_CITY_TEMPLATE;
        const newCity = new Building(cityTemplate.TypeId, this.currentPlayerId, row, col, cityTemplate);
        this.buildings = [...this.buildings, newCity];
        
        const nextPlayerId = this.currentPlayerId + 1;
        if (nextPlayerId >= this.players.length) {
            this.gamePhase = 'PLANNING';
            this.currentPlayerId = 0;
        } else {
            this.currentPlayerId = nextPlayerId;
        }
        
        return this.getState();
    }

    endTurnForCurrentPlayer() {
        this.players = this.players.map((player, index) => {
            if (index === this.currentPlayerId) {
                return { ...player, isTurnFinished: true };
            }
            return player;
        });
        
        const allFinished = this.players.every(p => p.isTurnFinished);
        if (allFinished) {
            this.gamePhase = 'EXECUTING';
            return this.resolveTurn();
        } else {
            this.switchToNextPlayer();
        }
        return this.getState();
    }
    
    switchToNextPlayer() {
        let nextPlayerId = (this.currentPlayerId + 1) % this.players.length;
        while (this.players[nextPlayerId].isTurnFinished) {
            nextPlayerId = (nextPlayerId + 1) % this.players.length;
        }
        this.currentPlayerId = nextPlayerId;
        return this.getState();
    }

    resolveTurn() {
        console.log(`--- Engine: Resolving Turn ${this.turn} ---`);
        
        this.players = this.players.map(player => {
            const playerBuildings = this.buildings.filter(b => b.playerId === player.id);
            if (playerBuildings.length === 0) return player;

            const newResources = { ...player.resources };
            const resourceSources = {};
            playerBuildings.forEach(building => {
                if(building.canMine){
                    const cellResources = this.map.grid[building.pos.row][building.pos.col].resources || [];
                    cellResources.forEach(resTypeId => {
                        resourceSources[resTypeId] = (resourceSources[resTypeId] || 0) + 1;
                    });
                }
            });

            Object.entries(resourceSources).forEach(([resTypeId, count]) => {
                const gain = count * (Math.floor(Math.random() * 10) + 1);
                newResources[resTypeId] += gain;
            });

            return { ...player, resources: newResources };
        });

        this.players = this.players.map(p => ({ ...p, isTurnFinished: false }));
        this.currentPlayerId = 0;
        this.turn++;
        this.gamePhase = 'PLANNING';
        
        return this.getState();
    }
    
    generatePlayerColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = (360 / count) * i;
            colors.push(`hsl(${hue}, 90%, 60%)`);
        }
        return colors;
    }
    
    getState() {
        return {
            map: this.map,
            players: this.players,
            units: this.units,
            buildings: this.buildings,
            turn: this.turn,
            currentPlayerId: this.currentPlayerId,
            gamePhase: this.gamePhase,
        };
    }
}