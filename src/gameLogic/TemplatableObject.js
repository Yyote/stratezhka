/**
 * The base interface for all game objects that are defined in a template (a "set").
 */
export class TemplatableObject {
  constructor(typeId) {
    /**
     * The unique identifier for the type of this object (e.g., "swordsman", "grass", "iron_mine").
     * This corresponds to the template definition in a "set" file.
     * @type {string}
     */
    this.TypeId = typeId;
  }
}