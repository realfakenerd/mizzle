import { dynamoTable, dynamoEntity } from "./src/core/table";
import { string, uuid, number, boolean } from "./src/columns/all";
import { prefixKey, staticKey } from "./src/core/strategies";

export const usersTable = dynamoTable("users", {
    pk: string("pk"),
    sk: string("sk"),
});

export const userEntity = dynamoEntity(
    usersTable,
    "User",
    {
        id: uuid(),
        name: string(),
        email: string(),
        age: number(),
        isActive: boolean(),
    },
    (cols) => ({
        pk: prefixKey("USER#", cols.id),
        sk: staticKey("METADATA"),
    })
);
