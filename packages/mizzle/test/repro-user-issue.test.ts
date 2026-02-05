import { describe, it, expect } from "vitest";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { dynamoTable, dynamoEntity } from "../src/core/table";
import { defineRelations } from "../src/core/relations";
import { string, uuid } from "../src/columns";
import { mizzle } from "../src/db";

describe("User Issue Reproduction: MultiRelationsDefinition as schema", () => {
  const table = dynamoTable("mizzle-test", {
    pk: string("pk"),
    sk: string("sk"),
  });

  const shoppingLists = dynamoEntity(table, "shoppingLists", {
    id: uuid("id"),
    name: string("name"),
  });

  const client = new DynamoDBClient({ region: "us-east-1" });

  it("should allow using MultiRelationsDefinition directly in mizzle config", () => {
    const relations = defineRelations({ shoppingLists }, () => ({}));
    
    const db = mizzle({ 
      client, 
      relations 
    });

    // This is the part that fails in TypeScript for the user
    // We are testing runtime behavior here, but the types should also be checked
    expect(db.query.shoppingLists).toBeDefined();
  });
});
