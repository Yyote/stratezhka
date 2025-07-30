import { TemplatableObject } from './TemplatableObject';

/**
 * Represents a TEMPLATE for a research item/technology from a researchset.
 */
export class Research extends TemplatableObject {
  constructor(template) {
    super(template.TypeId);

    this.cost = template.cost || [];
    this.name = template.name || "Unnamed Research";
    this.description = template.description || "";
    this.requiresResearch = template.requiresResearch || []; // NEW PROPERTY
  }
}