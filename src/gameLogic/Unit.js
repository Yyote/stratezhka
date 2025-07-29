import { TemplatableObject } from './TemplatableObject';
import { GridPosition } from './GridPosition';

/**
 * Represents an INSTANCE of a unit on the map.
 * Its properties are a combination of instance-specific data
 * and constants derived from a unit template.
 */
export class Unit extends TemplatableObject {
  constructor(typeId, playerId, row, col, template) {
    super(typeId);

    // ==========================================================
    // INSTANCE-SPECIFIC VARIABLES (State that can change per unit)
    // ==========================================================
    
    /** @type {number} */
    this.id = Date.now() + Math.random(); // Unique instance ID
    
    /** @type {number} */
    this.playerId = playerId;
    
    /** @type {GridPosition} */
    this.pos = new GridPosition(row, col);
    
    /** @type {number} */
    this.hp = template.max_hp || 1;
    
    /** @type {number} */
    this.attack_bonus = 0;
    
    /** @type {number} */
    this.defense_bonus = 0;
    
    /** @type {number} */
    this.carrier_carried_hp = 0;
    
    /** @type {number} */
    this.remaining_turns_to_build = template.build_time || 1;

    // ==========================================================
    // CONSTANTS FROM TEMPLATE (Properties that define the unit type)
    // ==========================================================
    
    /** @type {string} */
    this.texture = template.texture_path;
    
    /** @type {Array<string>} */
    this.requiresResearch = template.requiresResearch || [];
    
    /** @type {boolean} */
    this.land_traversing = template.land_traversing || false;
    
    /** @type {boolean} */
    this.air_traversing = template.air_traversing || false;
    
    /** @type {boolean} */
    this.overwater_traversing = template.overwater_traversing || false;
    
    /** @type {boolean} */
    this.underwater_traversing = template.underwater_traversing || false;
    
    /** @type {Array<{resourceTypeId: string, amount: number}>} */
    this.cost = template.cost || [];
    
    /** @type {number} */
    this.build_time = template.build_time || 1;
    
    /** @type {number} */
    this.movement_radius = template.movement_radius || 0;
    
    /** @type {number} */
    this.min_attack_distance = template.min_attack_distance || 0;
    
    /** @type {number} */
    this.max_attack_distance = template.max_attack_distance || 1;
    
    /** @type {number} */
    this.attack = template.attack || 1;
    
    /** @type {number} */
    this.defense = template.defense || 1;
    
    /** @type {number} */
    this.max_hp = template.max_hp || 1;
    
    /** @type {number} */
    this.carrier_capability = template.carrier_capability || 0;
    
    /** @type {boolean} */
    this.can_carry_type_land = template.can_carry_type_land || false;
    
    /** @type {boolean} */
    this.can_carry_type_air = template.can_carry_type_air || false;
    
    /** @type {boolean} */
    this.can_carry_type_overwater = template.can_carry_type_overwater || false;
    
    /** @type {boolean} */
    this.can_carry_type_underwater = template.can_carry_type_underwater || false;
  }
}