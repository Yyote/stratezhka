import { TemplatableObject } from './TemplatableObject';

/**
 * Represents a TEMPLATE for a resource type from a resourceset.
 */
export class Resource extends TemplatableObject {
  constructor(template) {
    super(template.TypeId);

    // REMOVED: The requiresResearch attribute to break the dependency cycle.
    // this.requiresResearch = template.requiresResearch || [];

    this.texture = template.texture_path;
    // A list of tile TypeIds where this resource can spawn.
    this.canBeOn = template.canBeOn || [];
    // An object mapping tile TypeIds to their spawn chance (0.0 to 1.0).
    this.possibility = template.possibility || {};
    this.description = template.description || "";
  }
}