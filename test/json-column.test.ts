import { describe, it, expect } from "vitest";
import { json } from "mizzle/columns";
import { dynamoTable, dynamoEntity } from "mizzle/table";

describe("json column", () => {
  it("should define a json column", () => {
    const col = json("data");
    expect(col.config.name).toBe("data");
    expect(col.config.dataType).toBe("json");
  });

  it("should serialize objects to strings for DynamoDB", () => {
    const table = dynamoTable("test", {
      pk: json("pk").partitionKey(),
    });
    const entity = dynamoEntity(table, "test", {
      pk: json("pk"),
    });
    const col = entity.pk;
    const data = { hello: "world", numbers: [1, 2, 3] };
    
    expect(col.mapToDynamoValue(data)).toBe(JSON.stringify(data));
  });

  it("should deserialize strings from DynamoDB back to objects", () => {
    const table = dynamoTable("test", {
      pk: json("pk").partitionKey(),
    });
    const entity = dynamoEntity(table, "test", {
      pk: json("pk"),
    });
    const col = entity.pk;
    const data = { hello: "world" };
    const serialized = JSON.stringify(data);
    
    expect(col.mapFromDynamoValue(serialized)).toEqual(data);
  });

  it("should return raw value if parsing fails", () => {
    const table = dynamoTable("test", {
      pk: json("pk").partitionKey(),
    });
    const entity = dynamoEntity(table, "test", {
      pk: json("pk"),
    });
    const col = entity.pk;
    const invalidJson = "{ invalid }";
    
    expect(col.mapFromDynamoValue(invalidJson as any)).toBe(invalidJson);
  });
});
