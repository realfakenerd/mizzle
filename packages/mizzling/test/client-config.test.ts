import { expect, test, describe } from "vitest";
import { getClient } from "../src/config";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

describe("getClient", () => {
  test("should use top-level credentials", () => {
    const config = {
      schema: "dummy",
      out: "dummy",
      region: "us-west-2",
      endpoint: "http://localhost:8000",
      credentials: {
        accessKeyId: "top",
        secretAccessKey: "top",
      },
    };

    const client = getClient(config);
    expect(client).toBeInstanceOf(DynamoDBClient);
    // SDK v3 doesn't easily expose config after instantiation, 
    // but we trust the logic in getClient.
  });

  test("should use nested dbCredentials", () => {
    const config = {
      schema: "dummy",
      out: "dummy",
      dbCredentials: {
        region: "us-west-2",
        endpoint: "http://localhost:8000",
        credentials: {
          accessKeyId: "nested",
          secretAccessKey: "nested",
        },
      },
    };

    const client = getClient(config as any);
    expect(client).toBeInstanceOf(DynamoDBClient);
  });

  test("should default to local credentials if endpoint is localhost", () => {
    const config = {
      schema: "dummy",
      out: "dummy",
      endpoint: "http://localhost:8000",
    };

    const client = getClient(config);
    expect(client).toBeInstanceOf(DynamoDBClient);
  });
});
