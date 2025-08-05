import { TemplatableObject } from './TemplatableObject';
import { GridPosition } from './GridPosition';

/**
 * Represents an INSTANCE of a tile on the game map.
 * Its properties are derived from a tile template in the active tileset.
 */
export class Cell extends TemplatableObject {
  constructor(typeId, row, col, template) {
    super(typeId);

    // --- Instance-specific variables ---
    /** @type {GridPosition} */
    this.pos = new GridPosition(row, col);
    /** @type {Array<Unit | Building>} */
    this.entities = [];
    /** @type {number | null} */
    this.playerId = null; // ID of the player who owns/controls this cell

    // --- Properties derived from the template ---
    /** @type {string} */
    this.texture = template.texture_path;
    /** @type {boolean} */
    this.land_passable = template.land_passable;
    /** @type {boolean} */
    this.air_passable = template.air_passable;
    /** @type {boolean} */
    this.overwater_passable = template.overwater_passable;
    /** @type {boolean} */
    this.underwater_passable = template.underwater_passable;
    /** @type {boolean} */
    this.shallow_water_passable = template.shallow_water_passable || false;
    /** @type {number} */
    this.consumes_movement = template.consumes_movement ?? 1;
  }
}

