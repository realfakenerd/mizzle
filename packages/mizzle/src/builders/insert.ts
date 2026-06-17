import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ENTITY_SYMBOLS, TABLE_SYMBOLS } from "@repo/shared";
import { Entity, type InferInsertModel } from "../core/table";
import { BaseBuilder } from "./base";
import { Column } from "../core/column";
import type { KeyStrategy } from "../core/strategies";
import { type IMizzleClient } from "../core/client";
import { calculateItemSize } from "../core/validation";
import { ItemSizeExceededError } from "../core/errors";
import { marshallDates } from "../core/marshalling";
import { processValues } from "../core/builder-utils";

export class InsertBuilder<TEntity extends Entity> {
  static readonly [ENTITY_SYMBOLS.ENTITY_KIND]: string = "InsertBuilder";

  constructor(
    private entity: TEntity,
    private client: IMizzleClient,
  ) {}

  /**
   * Sets the values to be inserted into the database.
   *
   * @example
   * ```ts
   * await db.insert(users).values({ id: "1", name: "Alice" }).execute();
   * ```
   *
   * @param values The object containing the attributes to insert.
   * @returns An InsertBase instance for further chaining.
   */
  values(values: InferInsertModel<TEntity>): InsertBase<TEntity> {
    return new InsertBase(this.entity, this.client, values);
  }
}

interface MinimalPhysicalTable {
  [TABLE_SYMBOLS.INDEXES]?: Record<string, { config: { pk: string; sk?: string } }>;
}

export class InsertBase<TEntity extends Entity, TResult = undefined> extends BaseBuilder<
  TEntity,
  TResult
> {
  static readonly [ENTITY_SYMBOLS.ENTITY_KIND]: string = "InsertBase";

  private shouldReturnValues = false;

  constructor(
    entity: TEntity,
    client: IMizzleClient,
    private valuesData: InferInsertModel<TEntity>,
  ) {
    super(entity, client);
  }

  /** @internal */
  get values() {
    return this.valuesData;
  }

  /**
   * Instructs Mizzle to return the inserted item after execution.
   *
   * @returns The current builder instance with an updated result type.
   */
  returning(): InsertBase<TEntity, InferInsertModel<TEntity>> {
    this.shouldReturnValues = true;
    return this as unknown as InsertBase<TEntity, InferInsertModel<TEntity>>;
  }

  /** @internal */
  buildItem(): Record<string, unknown> {
    const itemToSave = processValues(this.entity, this.valuesData);
    const resolution = this.resolveKeys(undefined, itemToSave);

    const finalItem: Record<string, unknown> = { ...itemToSave, ...resolution.keys };

    // Also resolve GSI keys if they are defined in strategies but not in resolution.keys
    const strategies = this.entity[ENTITY_SYMBOLS.ENTITY_STRATEGY] as unknown as Record<
      string,
      { pk: KeyStrategy; sk?: KeyStrategy }
    >;
    const physicalTable = this.entity[
      ENTITY_SYMBOLS.PHYSICAL_TABLE
    ] as unknown as MinimalPhysicalTable;
    const indexes = physicalTable?.[TABLE_SYMBOLS.INDEXES] || {};

    for (const [indexName, strategy] of Object.entries(strategies)) {
      if (indexName === "pk" || indexName === "sk") continue;

      const indexBuilder = indexes[indexName];
      if (indexBuilder) {
        if (strategy.pk && indexBuilder.config.pk) {
          const pkValue = this.resolveStrategyValue(strategy.pk, itemToSave);
          if (pkValue) finalItem[indexBuilder.config.pk] = pkValue;
        }
        if (strategy.sk && indexBuilder.config.sk) {
          const skValue = this.resolveStrategyValue(strategy.sk, itemToSave);
          if (skValue) finalItem[indexBuilder.config.sk] = skValue;
        }
      }
    }

    return finalItem;
  }

  /**
   * Executes the insert operation.
   *
   * @returns A promise that resolves to the inserted item if `.returning()` was called, otherwise undefined.
   * @throws {ItemSizeExceededError} if the item exceeds 400KB.
   */
  override async execute(): Promise<TResult> {
    const finalItem = this.buildItem();

    // Size validation
    const size = calculateItemSize(finalItem);
    if (size > 400 * 1024) {
      throw new ItemSizeExceededError(
        `Item size of ${Math.round(size / 1024)}KB exceeds the 400KB limit.`,
      );
    }

    const command = new PutCommand({
      TableName: this.tableName,
      Item: finalItem,
    });

    await this.client.send(command);
    if (this.shouldReturnValues) return finalItem as unknown as TResult;

    return undefined as unknown as TResult;
  }

  private resolveStrategyValue(
    strategy: KeyStrategy,
    availableValues: Record<string, unknown>,
  ): string | undefined {
    if (strategy.type === "static") {
      return strategy.segments[0] as string;
    }

    const resolvedParts: string[] = [];

    for (const segment of strategy.segments) {
      if (typeof segment === "string") {
        resolvedParts.push(segment);
      } else {
        const val = availableValues[segment.name];
        if (val === undefined || val === null) return undefined;
        resolvedParts.push(String(val));
      }
    }

    if (strategy.type === "prefix") return resolvedParts.join("");
    if (strategy.type === "composite") return resolvedParts.join(strategy.separator || "#");
    return undefined;
  }
}
