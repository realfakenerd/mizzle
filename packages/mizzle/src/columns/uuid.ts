import { Column, type ColumnBaseConfig } from "../core/column";
import { v7 as uuidV7 } from "uuid";
import {
    ColumnBuider,
    type ColumnBuilderBaseConfig,
    type ColumnBuilderRuntimeConfig,
    type MakeColumnConfig,
} from "../core/column-builder";
import type { AnyTable } from "../core/table";

const uuidDefault = () => uuidV7();

export type UUIDColumnInitial<TName extends string> = UUIDColumnBuilder<{
    name: TName;
    dataType: "string";
    columnType: "S";
    data: string;
}>;

export class UUIDColumnBuilder<
    T extends ColumnBuilderBaseConfig<"string", "S">,
> extends ColumnBuider<T> {
    constructor(name: string) {
        super(name, "string", "S");

        this.config.defaultFn = uuidDefault;
    }

    /** @internal */
    build<TTableName extends string>(
        table: AnyTable,
    ): UUIDColumn<MakeColumnConfig<T, TTableName>> {
        return new UUIDColumn<MakeColumnConfig<T, TTableName>>(
            table,
            this.config as ColumnBuilderRuntimeConfig<T["data"], object>,
        );
    }
}

export class UUIDColumn<
    T extends ColumnBaseConfig<"string", "S">,
> extends Column<T> {
    override getDynamoType(): string {
        return "S";
    }
}

export function uuid(): UUIDColumnInitial<"">;
export function uuid<TName extends string>(
    name: TName,
): UUIDColumnInitial<TName>;
export function uuid(name?: string) {
    return new UUIDColumnBuilder(name ?? "");
}
