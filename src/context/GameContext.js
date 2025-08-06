import React, { createContext, useReducer, useContext } from 'react';
import { GameEngine } from '../gameLogic/GameEngine';
import { NotificationContext } from './NotificationContext';

export const GameContext = createContext();

const gameReducer = (state, action, dispatchNotification) => {
    const engine = new GameEngine(
        state.map, 
        { players: state.players },
        state.staticData.tileset, 
        state.staticData.resourceSet, 
        state.staticData.researchSet, 
        state.staticData.unitSet, 
        state.staticData.buildingSet
    );
    
    engine.units = state.units;
    engine.buildings = state.buildings;
    engine.turn = state.turn;
    engine.currentPlayerId = state.currentPlayerId;
    engine.gamePhase = state.gamePhase;
    engine.players = state.players;


    let newState;
    switch (action.type) {
        case 'PLACE_STARTING_CITY':
            newState = engine.placeStartingCity(action.payload.row, action.payload.col);
            break;
        case 'PLACE_BUILDING':
            newState = engine.placeBuilding(state.currentPlayerId, action.payload.buildingTypeId, action.payload.row, action.payload.col);
            break;
        case 'END_TURN':
            newState = engine.endTurnForCurrentPlayer();
            break;
        case 'SWITCH_PLAYER':
            newState = engine.switchToNextPlayer();
            break;
        default:
            return state;
    }
    
    if (newState.error) {
        console.error("Game Engine Error:", newState.error);
        dispatchNotification(newState.error, 'error');
        return state;
    }
    
    return { ...newState, staticData: state.staticData };
};


export const GameProvider = ({ children, mapData, gameSettings, tileset, resourceSet, researchSet, unitSet, buildingSet }) => {
    const { addNotification } = useContext(NotificationContext);

    const staticData = { tileset, resourceSet, researchSet, unitSet, buildingSet };
    const engine = new GameEngine(mapData, gameSettings, tileset, resourceSet, researchSet, unitSet, buildingSet);
    const initialState = { ...engine.getState(), staticData };

    const reducerWithNotification = (state, action) => gameReducer(state, action, addNotification);

    const [gameState, dispatch] = useReducer(reducerWithNotification, initialState);
    
    return (
        <GameContext.Provider value={{ gameState, dispatch }}>
            {children}
        </GameContext.Provider>
    );
};