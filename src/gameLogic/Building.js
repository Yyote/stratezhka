import { TemplatableObject } from './TemplatableObject';
import { GridPosition } from './GridPosition';

/**
 * Represents an INSTANCE of a building on the map.
 */
export class Building extends TemplatableObject {
  constructor(typeId, playerId, row, col, template) {
    super(typeId);

    // --- Instance-specific variables ---
    this.id = Date.now() + Math.random();
    this.playerId = playerId;
    this.pos = new GridPosition(row, col);
    this.hp = template.max_hp || 1;
    this.build_queue = [];
    this.remaining_turns_to_build = template.build_time || 1;

    // --- Constants from template ---
    this.name = template.name || "Unnamed Building";
    this.texture = template.texture_path;
    this.requiresResearch = template.requiresResearch || [];
    this.land_positioned = template.land_positioned || false;
    this.air_positioned = template.air_positioned || false;
    this.overwater_positioned = template.overwater_positioned || false;
    this.underwater_positioned = template.underwater_positioned || false;
    this.canBuild = template.canBuild || [];
    this.cost = template.cost || [];
    this.build_time = template.build_time || 1;
    this.attack = template.attack || 0;
    this.defense = template.defense || 1;
    this.max_hp = template.max_hp || 1;
    this.gives_attack_bonus = template.gives_attack_bonus || 0;
    this.gives_defense_bonus = template.gives_defense_bonus || 0;
    this.can_research = template.can_research || [];
    this.canMine = template.canMine || null;
    this.converts = template.converts || [];
    this.isRoad = template.isRoad || false;
    this.consumes_action_override = template.consumes_action_override || 0;
    
    // --- NEW PROPERTY ---
    this.alreadyBuiltCostModifier = template.alreadyBuiltCostModifier ?? 1;
  }
}