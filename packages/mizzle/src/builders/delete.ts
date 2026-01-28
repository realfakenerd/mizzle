import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ENTITY_SYMBOLS } from "@repo/shared";
import { Entity, type InferSelectModel } from "../core/table";
import { BaseBuilder } from "./base";
import { type IMizzleClient } from "../core/client";
import { type Expression } from "../expressions/operators";

export class DeleteBuilder<
  TEntity extends Entity,
  TResult = InferSelectModel<TEntity>,
> extends BaseBuilder<TEntity, TResult> {
  static readonly [ENTITY_SYMBOLS.ENTITY_KIND]: string = "DeleteBuilder";

  private _returnValues?: "NONE" | "ALL_OLD";
  private _keys: Record<string, unknown>;

  constructor(entity: TEntity, client: IMizzleClient, keys: Record<string, unknown>) {
    super(entity, client);
    this._keys = keys;
  }

  /**
   * Instructs Mizzle to return the deleted item after execution.
   *
   * @returns The current builder instance.
   */
  returning(): this {
    this._returnValues = "ALL_OLD";
    return this;
  }

  /** @internal */
  get keys() {
    return this._keys;
  }

  /** @internal */
  public override resolveKeys(whereClause?: Expression, providedValues?: Record<string, unknown>) {
    return super.resolveKeys(whereClause, providedValues);
  }

  /** @internal */
  public override createExpressionContext(prefix = "") {
    return super.createExpressionContext(prefix);
  }

  /**
   * Executes the delete operation.
   *
   * @returns A promise that resolves to the deleted item if `.returning()` was called, otherwise undefined.
   */
  public override async execute(): Promise<TResult> {
    const resolution = this.resolveKeys(undefined, this._keys);

    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: resolution.keys,
      ReturnValues: this._returnValues,
    });

    const response = (await this.client.send(command)) as any;
    return response.Attributes as TResult;
  }
}
