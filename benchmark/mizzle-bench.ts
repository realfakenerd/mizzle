import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
    mizzle, 
    dynamoTable, 
    dynamoEntity, 
    string, 
    number, 
    boolean,
    prefixKey,
    staticKey,
    eq,
    type DynamoDB
} from "mizzle";
import { TABLE_NAME, REGION, ENDPOINT } from "./env";
import type { BenchmarkItem } from "./data-gen";

// Define the physical table
const table = dynamoTable(TABLE_NAME, {
    pk: string("pk").partitionKey(),
    sk: string("sk").sortKey(),
});

// Define the entity
const User = dynamoEntity(
    table,
    "User",
    {
        id: string("id"),
        name: string("name"),
        email: string("email"),
        age: number("age"),
        active: boolean("active"),
        createdAt: string("createdAt"),
        payload: string("payload"),
    },
    (cols) => ({
        pk: prefixKey("USER#", cols.id),
        sk: staticKey("METADATA"),
    })
);

export class MizzleBench {
    private db: DynamoDB;

    constructor() {
        const client = new DynamoDBClient({
            region: REGION,
            endpoint: ENDPOINT,
            credentials: {
                accessKeyId: "local",
                secretAccessKey: "local",
            },
        });
        this.db = mizzle(client);
    }

    async putItem(item: BenchmarkItem): Promise<void> {
        const id = item.pk.replace("USER#", "");
        
        await this.db.insert(User).values({
            id: id,
            name: item.name,
            email: item.email,
            age: item.age,
            active: item.active,
            createdAt: item.createdAt,
            payload: item.payload,
        } as any).execute();
    }

    async getItem(pk: string, _sk: string): Promise<BenchmarkItem | undefined> {
        const id = pk.replace("USER#", "");
        const results = await this.db
            .select()
            .from(User)
            .where(eq(User.id, id))
            .execute();
        
        if (results.length === 0) return undefined;
        
        const user = results[0];
        return {
            pk: `USER#${user.id}`,
            sk: "METADATA",
            name: user.name,
            email: user.email,
            age: user.age,
            active: user.active,
            createdAt: user.createdAt,
            payload: user.payload,
        };
    }

    async updateItem(pk: string, _sk: string, updates: Partial<BenchmarkItem>): Promise<void> {
        const id = pk.replace("USER#", "");
        const { pk: __pk, sk: __sk, ...validUpdates } = updates as any;
        
        await this.db
            .update(User)
            .set(validUpdates)
            .where(eq(User.id, id))
            .execute();
    }

    async deleteItem(pk: string, _sk: string): Promise<void> {
        const id = pk.replace("USER#", "");
        await this.db
            .delete(User, { id } as any)
            .execute();
    }

    async queryItems(pk: string): Promise<BenchmarkItem[]> {
        const id = pk.replace("USER#", "");
        const results = await this.db
            .select()
            .from(User)
            .where(eq(User.id, id))
            .execute();
        
        return results.map(user => ({
            pk: `USER#${user.id}`,
            sk: "METADATA",
            name: user.name,
            email: user.email,
            age: user.age,
            active: user.active,
            createdAt: user.createdAt,
            payload: user.payload,
        }));
    }

    async scanItems(): Promise<BenchmarkItem[]> {
        const results = await this.db
            .select()
            .from(User)
            .execute();
        
        return results.map(user => ({
            pk: `USER#${user.id}`,
            sk: "METADATA",
            name: user.name,
            email: user.email,
            age: user.age,
            active: user.active,
            createdAt: user.createdAt,
            payload: user.payload,
        }));
    }
}
