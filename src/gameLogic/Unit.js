import { TemplatableObject } from './TemplatableObject';
import { GridPosition } from './GridPosition';

/**
 * Represents an INSTANCE of a unit on the map.
 */
export class Unit extends TemplatableObject {
  constructor(typeId, playerId, row, col, template) {
    super(typeId);

    // --- Instance-specific variables ---
    this.id = Date.now() + Math.random();
    this.playerId = playerId;
    this.pos = new GridPosition(row, col);
    this.hp = template.max_hp || 1;
    this.attack_bonus = 0;
    this.defense_bonus = 0;
    this.carrier_carried_hp = 0;
    this.remaining_turns_to_build = template.build_time || 1;
    this.move_actions = template.max_move_actions || 1;

    // --- Constants from template ---
    this.name = template.name || "Unnamed Unit";
    this.texture = template.texture_path;
    this.requiresResearch = template.requiresResearch || [];
    this.land_traversing = template.land_traversing || false;
    this.air_traversing = template.air_traversing || false;
    this.overwater_traversing = template.overwater_traversing || false;
    this.underwater_traversing = template.underwater_traversing || false;
    this.shallow_water_traversing = template.shallow_water_traversing || false;
    this.cost = template.cost || [];
    this.build_time = template.build_time || 1;
    this.max_move_actions = template.max_move_actions || 1;
    this.min_attack_distance = template.min_attack_distance || 0;
    this.max_attack_distance = template.max_attack_distance || 1;
    this.attack = template.attack || 1;
    this.defense = template.defense || 1;
    this.max_hp = template.max_hp || 1;
    this.carrier_capability = template.carrier_capability || 0;
    this.can_carry_type_land = template.can_carry_type_land || false;
    this.can_carry_type_air = template.can_carry_type_air || false;
    this.can_carry_type_overwater = template.can_carry_type_overwater || false;
    this.can_carry_type_underwater = template.can_carry_type_underwater || false;
    this.can_carry_type_shallow_water = template.can_carry_type_shallow_water || false;
    this.isColonist = template.isColonist || false;
    this.land_placed = template.land_placed || false;
    this.overwater_placed = template.overwater_placed || false;
    this.underwater_placed = template.underwater_placed || false;
    this.shallow_water_placed = template.shallow_water_placed || false;
  }
}