import { TemplatableObject } from './TemplatableObject';

/**
 * Represents a TEMPLATE for a resource type from a resourceset.
 */
export class Resource extends TemplatableObject {
  constructor(template) {
    super(template.TypeId);

    /** @type {string} - The user-friendly display name */
    this.name = template.name || "Unnamed Resource";

    this.texture = template.texture_path;
    this.canBeOn = template.canBeOn || [];
    this.possibility = template.possibility || {};
    this.description = template.description || "";
  }
}