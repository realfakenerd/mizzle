export const INFER_MODE = {
    QUERY: "query",
    RAW: "raw",
} as const;

export const ORDER = {
    ASC: "asc",
    DESC: "desc",
} as const;

export const NULLS = {
    FIRST: "first",
    LAST: "last",
} as const;

export const TABLE_SYMBOLS = {
    COLUMNS: Symbol.for("mizzle:Columns"),
    INDEXES: Symbol.for("mizzle:Indexes"),
    SORT_KEY: Symbol.for("mizzle:SortKey"),
    TABLE_NAME: Symbol.for("mizzle:TableName"),
    PARTITION_KEY: Symbol.for("mizzle:PartitionKey"),
};

export const ENTITY_SYMBOLS = {
    ENTITY_NAME: Symbol.for("mizzle:EntityName"),
    ENTITY_STRATEGY: Symbol.for("mizzle:EntityStrategy"),
    PHYSICAL_TABLE: Symbol.for("mizzle:PhysicalTable"),
    COLUMNS: Symbol.for("mizzle:Columns"),
};
