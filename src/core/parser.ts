import { ENTITY_SYMBOLS, TABLE_SYMBOLS } from "../constants";
import type { InternalRelationalSchema } from "./relations";
import { KeyStrategy } from "./strategies";

/**
 * Parser for DynamoDB item collections (Single-Table Design).
 */
export class ItemCollectionParser {
    constructor(private schema: InternalRelationalSchema) {}

    /**
     * Parse a flat list of items into structured, nested objects.
     */
    parse(items: any[], rootEntityName: string, relations: Record<string, any> = {}) {
        const rootEntityMeta = this.schema.entities[rootEntityName];
        if (!rootEntityMeta) {
            throw new Error(`Root entity ${rootEntityName} not found in schema`);
        }

        const primaryItems: any[] = [];
        const otherItems: any[] = [];

        // 1. Identify primary items vs related items
        for (const item of items) {
            if (this.isEntity(item, rootEntityMeta.entity)) {
                primaryItems.push({ ...item });
            } else {
                otherItems.push(item);
            }
        }

        // 2. For each primary item, find its relations
        for (const primaryItem of primaryItems) {
            for (const [relName, relOption] of Object.entries(relations)) {
                if (!relOption) continue;

                const relConfig = rootEntityMeta.relations[relName];
                if (!relConfig) continue;

                const targetEntity = relConfig.config.to;
                
                // Find items that match the target entity type
                // In Single-Table Design Query, these items usually share the same PK
                const relatedItems = otherItems.filter(item => this.isEntity(item, targetEntity));

                // TODO: More advanced matching for cases where multiple primary items are in the collection
                // For now, we assume a single collection for a single PK (standard findMany/findFirst behavior)
                
                if (relConfig.type === "many") {
                    primaryItem[relName] = relatedItems;
                } else if (relConfig.type === "one") {
                    primaryItem[relName] = relatedItems[0] || null;
                }
            }
        }

        return primaryItems;
    }

    /**
     * Check if an item matches an entity definition based on its key strategies.
     */
    private isEntity(item: any, entity: any): boolean {
        const strategies = entity[ENTITY_SYMBOLS.ENTITY_STRATEGY] as Record<string, KeyStrategy>;
        const physicalTable = entity[ENTITY_SYMBOLS.PHYSICAL_TABLE] as any;

        const pkName = physicalTable[TABLE_SYMBOLS.PARTITION_KEY].name;
        const skName = physicalTable[TABLE_SYMBOLS.SORT_KEY]?.name;

        const pkMatch = this.matchStrategy(item[pkName], strategies.pk);
        const skMatch = skName ? this.matchStrategy(item[skName], strategies.sk) : true;

        return pkMatch && skMatch;
    }

    /**
     * Check if a value matches a key strategy.
     */
    private matchStrategy(value: any, strategy?: KeyStrategy): boolean {
        if (!strategy) return true;
        if (value === undefined || value === null) return false;

        const strValue = String(value);

        if (strategy.type === "static") {
            return strValue === strategy.segments[0];
        }

        if (strategy.type === "prefix" || strategy.type === "composite") {
            const prefix = strategy.segments[0];
            return typeof prefix === "string" && strValue.startsWith(prefix);
        }

        return false;
    }
}
