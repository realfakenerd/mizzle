import {
    compositeKey,
    date,
    defineRelations,
    dynamoEntity,
    dynamoTable,
    eq,
    gsi,
    list,
    mizzle,
    number,
    prefixKey,
    staticKey,
    string,
    uuid,
} from "./packages/mizzle/src/index";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const table = dynamoTable("Teste", {
    pk: string("pk"),
    sk: string("sk"),
    indexes: {
        geoHash: gsi("gsi1pk", "gsi1sk"),
    },
});

export const users = dynamoEntity(
    table,
    "User",
    {
        uid: string(),
        name: string(),
        email: string(),
        level: number().default(1),
        xp: number().default(0),
        subcription: string().default("free"),
    },
    (cols) => ({
        pk: prefixKey("USER#", cols.uid),
        sk: staticKey("METADATA"),
    }),
);

export const product = dynamoEntity(
    table,
    "Product",
    {
        id: uuid(),
        name: string(),
        brand: string(),

        // EAN do OpenFoodFacts
        barcode: string(),
    },
    (cols) => ({
        pk: prefixKey("PROD#", cols.id),
        sk: staticKey("METADATA"),
    }),
);

export const productPrice = dynamoEntity(
    table,
    "ProductPrice",
    {
        productID: string(),
        branchId: string(),
        price: number(),
        capturedAt: date(),
        expiresAt: number(),
    },
    (cols) => ({
        pk: prefixKey("PROD#", cols.productID),
        sk: compositeKey("#", "PRICE", cols.branchId, cols.capturedAt),
    }),
);

export const storeBrand = dynamoEntity(
    table,
    "StoreBrand",
    {
        id: uuid(),
        name: string(),
        logoUrl: string(),
    },
    (cols) => ({
        pk: prefixKey("SHOP#", cols.id),
        sk: staticKey("METADATA"),
    }),
);

export const storeBranch = dynamoEntity(
    table,
    "StoreBranch",
    {
        id: uuid(),
        brandId: string(),
        address: string(),
        geohash: string(),
    },
    (cols) => ({
        pk: prefixKey("SHOP#", cols.brandId),
        sk: prefixKey("BRANCH#", cols.id),
        geoHash: {
            pk: cols.geohash,
        },
    }),
);

export const shoppingList = dynamoEntity(
    table,
    "ShoppingList",
    {
        id: uuid(),
        userId: string(),
        name: string(),
        description: string(),
        productIds: list().$type<string[]>(),
        createdAt: date(),
    },
    (cols) => ({
        pk: prefixKey("USER#", cols.userId),
        sk: prefixKey("LIST#", cols.id),
    }),
);

export const producRelations = defineRelations(product, ({ many }) => ({
    prices: many(productPrice, {
        fields: [product.id],
        references: [productPrice.productID],
    }),
}));

export const brandRelations = defineRelations(storeBrand, ({ many }) => ({
    branches: many(storeBranch, {
        fields: [storeBranch.id],
        references: [storeBranch.brandId],
    }),
}));

export const userRelations = defineRelations(users, ({ many }) => ({
    lists: many(shoppingList, {
        fields: [users.uid],
        references: [shoppingList.userId],
    }),
}));

const relations = defineRelations({ users, storeBranch }, (r) => ({
    users: {},
}));

const db = mizzle({
    client: new DynamoDBClient({}),
    relations,
});

db.select().from(users).where(eq(users.id, ""));
