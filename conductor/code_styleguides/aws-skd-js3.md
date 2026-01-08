# AWS SDK for JavaScript v3

The AWS SDK for JavaScript v3 is a complete rewrite of v2 with a modular architecture that enables importing individual AWS service clients as separate packages. This design significantly reduces bundle sizes by eliminating unused code, particularly beneficial for browser and Lambda deployments. The SDK supports Node.js 18+, browsers, and React Native environments with first-class TypeScript support and a modern middleware stack for request/response customization. As of version 3.723.0+, Node.js 18 or higher is required.

The SDK's modular approach means each AWS service (S3, DynamoDB, Lambda, etc.) is published as an independent npm package under `@aws-sdk/client-*` naming. Developers can install only the services they need, reducing application footprint. The SDK uses a command pattern where each API operation is represented as a Command object sent through a client instance. This architecture supports both bare-bones commands (importing individual operations) and aggregated clients (all operations available on the client), with bare-bones being recommended for optimal bundle size. The middleware stack enables powerful customization at different lifecycle stages (initialize, serialize, build, finalize, deserialize) while maintaining backward compatibility with credential providers and configuration from v2.

## Client Initialization and Basic Operations

### Creating and configuring service clients

Initialize AWS service clients with region and credentials configuration, then execute operations using Command objects with async/await pattern.

```javascript
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: "us-west-2",
  credentials: {
    accessKeyId: "YOUR_ACCESS_KEY",
    secretAccessKey: "YOUR_SECRET_KEY"
  }
});

const command = new ListTablesCommand({ Limit: 10 });

try {
  const data = await client.send(command);
  console.log("Tables:", data.TableNames);
} catch (error) {
  console.error("Error:", error.name, error.message);
  console.log("Request ID:", error.$metadata.requestId);
} finally {
  client.destroy(); // Clean up resources
}
```

### S3 object operations with stream handling

Upload and download S3 objects with proper stream handling and metadata access using the SdkStreamMixin methods.

```javascript
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { createReadStream } from "fs";

const s3Client = new S3Client({ region: "us-east-1" });

// Upload object
const uploadCommand = new PutObjectCommand({
  Bucket: "my-bucket",
  Key: "documents/report.pdf",
  Body: createReadStream("./local-report.pdf"),
  ContentType: "application/pdf",
  Metadata: {
    author: "John Doe",
    department: "Finance"
  }
});

try {
  const uploadResult = await s3Client.send(uploadCommand);
  console.log("Upload ETag:", uploadResult.ETag);
  console.log("Version ID:", uploadResult.VersionId);
} catch (error) {
  console.error("Upload failed:", error.message);
}

// Download and process object
const downloadCommand = new GetObjectCommand({
  Bucket: "my-bucket",
  Key: "documents/report.pdf"
});

try {
  const response = await s3Client.send(downloadCommand);

  // Convert stream to string (for text files)
  const bodyAsString = await response.Body.transformToString();
  console.log("Content:", bodyAsString.substring(0, 100));

  // Or get as byte array
  const bodyAsBytes = await response.Body.transformToByteArray();
  console.log("Size:", bodyAsBytes.length, "bytes");

  console.log("Metadata:", response.Metadata);
  console.log("Content-Type:", response.ContentType);
} catch (error) {
  if (error.name === "NoSuchKey") {
    console.error("Object does not exist");
  } else {
    console.error("Download failed:", error.message);
  }
}
```

### DynamoDB table and item operations

Create tables and perform CRUD operations on DynamoDB items with proper attribute type definitions.

```javascript
import {
  DynamoDBClient,
  CreateTableCommand,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-west-2" });

// Create table
const createTableCommand = new CreateTableCommand({
  TableName: "Users",
  AttributeDefinitions: [
    { AttributeName: "userId", AttributeType: "S" },
    { AttributeName: "email", AttributeType: "S" }
  ],
  KeySchema: [
    { AttributeName: "userId", KeyType: "HASH" }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "EmailIndex",
      KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
      Projection: { ProjectionType: "ALL" },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    }
  ],
  BillingMode: "PROVISIONED",
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
});

try {
  await client.send(createTableCommand);
  console.log("Table created successfully");
} catch (error) {
  if (error.name === "ResourceInUseException") {
    console.log("Table already exists");
  }
}

// Put item
const putCommand = new PutItemCommand({
  TableName: "Users",
  Item: {
    userId: { S: "user123" },
    email: { S: "user@example.com" },
    name: { S: "John Doe" },
    age: { N: "30" },
    isActive: { BOOL: true },
    tags: { SS: ["premium", "verified"] },
    metadata: { M: {
      createdAt: { S: new Date().toISOString() },
      source: { S: "web" }
    }}
  }
});

await client.send(putCommand);

// Get item
const getCommand = new GetItemCommand({
  TableName: "Users",
  Key: { userId: { S: "user123" } },
  ProjectionExpression: "userId, email, #n, age",
  ExpressionAttributeNames: { "#n": "name" }
});

const getResult = await client.send(getCommand);
console.log("User:", getResult.Item);

// Update item
const updateCommand = new UpdateItemCommand({
  TableName: "Users",
  Key: { userId: { S: "user123" } },
  UpdateExpression: "SET age = :newAge, #n = :newName",
  ExpressionAttributeNames: { "#n": "name" },
  ExpressionAttributeValues: {
    ":newAge": { N: "31" },
    ":newName": { S: "John Smith" }
  },
  ReturnValues: "ALL_NEW"
});

const updateResult = await client.send(updateCommand);
console.log("Updated user:", updateResult.Attributes);

// Delete item
const deleteCommand = new DeleteItemCommand({
  TableName: "Users",
  Key: { userId: { S: "user123" } },
  ConditionExpression: "attribute_exists(userId)",
  ReturnValues: "ALL_OLD"
});

const deleteResult = await client.send(deleteCommand);
console.log("Deleted user:", deleteResult.Attributes);
```

## Document Client for DynamoDB

### Simplified DynamoDB operations with native JavaScript types

Use DynamoDB Document Client to work with native JavaScript objects instead of AttributeValue format, automatically marshalling and unmarshalling data.

```javascript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  BatchWriteCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-west-2" });

// Create document client with custom configuration
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true
  },
  unmarshallOptions: {
    wrapNumbers: false
  }
});

// Put item with native types
await docClient.send(new PutCommand({
  TableName: "Products",
  Item: {
    productId: "prod-001",
    name: "Laptop",
    price: 999.99,
    inStock: true,
    categories: ["electronics", "computers"],
    specifications: {
      cpu: "Intel i7",
      ram: "16GB",
      storage: "512GB SSD"
    },
    tags: new Set(["featured", "bestseller"]),
    createdAt: new Date().toISOString()
  }
}));

// Get item
const result = await docClient.send(new GetCommand({
  TableName: "Products",
  Key: { productId: "prod-001" }
}));

console.log("Product:", result.Item);
// Output: { productId: 'prod-001', name: 'Laptop', price: 999.99, ... }

// Query with filter
const queryResult = await docClient.send(new QueryCommand({
  TableName: "Orders",
  IndexName: "UserIdIndex",
  KeyConditionExpression: "userId = :userId AND orderDate > :date",
  FilterExpression: "#status = :status AND totalAmount > :amount",
  ExpressionAttributeNames: {
    "#status": "status"
  },
  ExpressionAttributeValues: {
    ":userId": "user123",
    ":date": "2024-01-01",
    ":status": "completed",
    ":amount": 100
  },
  Limit: 20
}));

console.log("Orders:", queryResult.Items);
console.log("Count:", queryResult.Count);

// Batch write operations
await docClient.send(new BatchWriteCommand({
  RequestItems: {
    "Products": [
      {
        PutRequest: {
          Item: { productId: "prod-002", name: "Mouse", price: 29.99 }
        }
      },
      {
        PutRequest: {
          Item: { productId: "prod-003", name: "Keyboard", price: 79.99 }
        }
      },
      {
        DeleteRequest: {
          Key: { productId: "prod-old" }
        }
      }
    ]
  }
}));

// Update with complex expressions
const updateResult = await docClient.send(new UpdateCommand({
  TableName: "Products",
  Key: { productId: "prod-001" },
  UpdateExpression: "SET price = price - :discount, #views = #views + :inc, categories = list_append(categories, :newCat)",
  ExpressionAttributeNames: {
    "#views": "viewCount"
  },
  ExpressionAttributeValues: {
    ":discount": 50,
    ":inc": 1,
    ":newCat": ["sale"]
  },
  ReturnValues: "ALL_NEW"
}));

console.log("Updated product:", updateResult.Attributes);
```

### Handling large numbers with NumberValue

Preserve precision for numbers exceeding JavaScript's MAX_SAFE_INTEGER using NumberValue class for exact representation.

```javascript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, NumberValue } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    allowImpreciseNumbers: false // Default: throws error on large numbers
  },
  unmarshallOptions: {
    wrapNumbers: true // Return NumberValue for all numbers
  }
});

// Store large numbers precisely
await client.send(new PutCommand({
  TableName: "FinancialData",
  Item: {
    transactionId: "tx-001",
    // Use NumberValue for numbers that exceed MAX_SAFE_INTEGER
    accountBalance: NumberValue.from("999999999999999999999.99"),
    smallNumber: 123, // Regular numbers work fine
    scientificNotation: NumberValue.from("1.23e+25"),
    // Number sets with mixed types
    amounts: new Set([
      100,
      NumberValue.from("888888888888888888888.88"),
      500
    ])
  }
}));

// Retrieve and handle large numbers
const result = await client.send(new GetCommand({
  TableName: "FinancialData",
  Key: { transactionId: "tx-001" }
}));

const balance = result.Item.accountBalance;

if (balance instanceof NumberValue) {
  console.log("Precise balance:", balance.toString());
  // Use with a big number library
  const Decimal = require('decimal.js');
  const preciseBalance = new Decimal(balance.toString());
  console.log("Calculate with precision:", preciseBalance.times(1.05).toString());
}

// Alternative: custom number handler
const customClient = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  unmarshallOptions: {
    wrapNumbers: (numStr) => {
      // Convert all numbers to BigInt
      return BigInt(numStr);
    }
  }
});

const bigIntResult = await customClient.send(new GetCommand({
  TableName: "FinancialData",
  Key: { transactionId: "tx-001" }
}));

// All numbers are now BigInt
console.log("Balance as BigInt:", bigIntResult.Item.accountBalance);
console.log("Type:", typeof bigIntResult.Item.accountBalance); // "bigint"
```

## Pagination and Async Iteration

### Paginating through large result sets

Use async iterators and paginator functions to efficiently process paginated API responses without manual token management.

```javascript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, paginateScan, paginateQuery, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, paginateListObjectsV2 } from "@aws-sdk/client-s3";

// DynamoDB pagination
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-west-2" }));

// Method 1: Using paginator helper (recommended)
const paginatorConfig = {
  client: dynamoClient,
  pageSize: 100
};

const scanParams = {
  TableName: "LargeTable",
  FilterExpression: "#status = :active",
  ExpressionAttributeNames: { "#status": "status" },
  ExpressionAttributeValues: { ":active": "active" }
};

let totalItems = 0;
let pageCount = 0;

for await (const page of paginateScan(paginatorConfig, scanParams)) {
  pageCount++;
  totalItems += page.Items.length;
  console.log(`Page ${pageCount}: ${page.Items.length} items`);

  // Process items
  page.Items.forEach(item => {
    console.log("Processing:", item.id);
  });

  if (pageCount >= 5) break; // Limit to first 5 pages
}

console.log(`Processed ${totalItems} total items across ${pageCount} pages`);

// Method 2: Manual pagination with ExclusiveStartKey
let lastEvaluatedKey = undefined;
let manualPageCount = 0;

do {
  const response = await dynamoClient.send(new ScanCommand({
    TableName: "LargeTable",
    Limit: 50,
    ExclusiveStartKey: lastEvaluatedKey
  }));

  manualPageCount++;
  console.log(`Manual page ${manualPageCount}: ${response.Items.length} items`);

  lastEvaluatedKey = response.LastEvaluatedKey;
} while (lastEvaluatedKey);

// S3 pagination example
const s3Client = new S3Client({ region: "us-east-1" });

for await (const page of paginateListObjectsV2(
  { client: s3Client },
  { Bucket: "my-large-bucket", Prefix: "documents/" }
)) {
  console.log(`Found ${page.Contents?.length || 0} objects`);

  page.Contents?.forEach(obj => {
    console.log(`  ${obj.Key} - ${obj.Size} bytes - ${obj.LastModified}`);
  });
}

// Query pagination with filtering
const queryPaginator = paginateQuery(
  { client: dynamoClient, pageSize: 25 },
  {
    TableName: "Orders",
    IndexName: "StatusIndex",
    KeyConditionExpression: "#status = :status",
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: { ":status": "pending" }
  }
);

const allPendingOrders = [];
for await (const page of queryPaginator) {
  allPendingOrders.push(...page.Items);

  // Early exit if we found enough
  if (allPendingOrders.length >= 100) break;
}

console.log(`Collected ${allPendingOrders.length} pending orders`);
```

## Multipart Upload with lib-storage

### Uploading large files with automatic multipart handling

Use the Upload class for efficient parallel multipart uploads with progress tracking and automatic retry handling.

```javascript
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { createReadStream } from "fs";
import { stat } from "fs/promises";

const s3Client = new S3Client({ region: "us-east-1" });

// Upload large file with progress tracking
async function uploadLargeFile(filePath, bucket, key) {
  const fileStats = await stat(filePath);
  const fileStream = createReadStream(filePath);

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: fileStream,
      ContentType: "video/mp4",
      ServerSideEncryption: "AES256",
      Metadata: {
        originalName: filePath,
        uploadedBy: "user123"
      }
    },

    // Configure multipart upload
    queueSize: 4, // Number of concurrent uploads
    partSize: 1024 * 1024 * 10, // 10MB parts
    leavePartsOnError: false, // Cleanup on failure

    tags: [
      { Key: "Environment", Value: "Production" },
      { Key: "Department", Value: "Media" }
    ]
  });

  // Track upload progress
  upload.on("httpUploadProgress", (progress) => {
    const percentage = (progress.loaded / fileStats.size * 100).toFixed(2);
    console.log(`Upload progress: ${percentage}% (${progress.loaded}/${fileStats.size} bytes)`);
    console.log(`Part: ${progress.part}, Key: ${progress.Key}`);
  });

  try {
    const result = await upload.done();
    console.log("Upload completed successfully");
    console.log("ETag:", result.ETag);
    console.log("Location:", result.Location);
    console.log("Bucket:", result.Bucket);
    console.log("Key:", result.Key);
    return result;
  } catch (error) {
    console.error("Upload failed:", error.message);
    throw error;
  }
}

// Upload from buffer
async function uploadFromBuffer(buffer, bucket, key) {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: buffer
    },
    queueSize: 3,
    partSize: 1024 * 1024 * 5 // 5MB parts
  });

  return await upload.done();
}

// Abort upload
async function uploadWithAbort(filePath, bucket, key, maxDuration) {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: createReadStream(filePath)
    }
  });

  // Abort after timeout
  const timeout = setTimeout(async () => {
    try {
      await upload.abort();
      console.log("Upload aborted due to timeout");
    } catch (error) {
      console.error("Error aborting upload:", error.message);
    }
  }, maxDuration);

  try {
    const result = await upload.done();
    clearTimeout(timeout);
    return result;
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === "AbortError") {
      console.log("Upload was aborted");
    }
    throw error;
  }
}

// Usage
await uploadLargeFile("./large-video.mp4", "my-bucket", "videos/large-video.mp4");
await uploadFromBuffer(Buffer.from("Hello World"), "my-bucket", "test.txt");
```

## Abort Controller for Request Cancellation

### Canceling in-flight requests

Use AbortController to cancel AWS API requests before completion, useful for user-initiated cancellations or timeout scenarios. Node.js 18+ includes native AbortController support, eliminating the need for external packages.

```javascript
// Node.js 18+ has native AbortController, no import needed
// For older environments, use: import { AbortController } from "@smithy/abort-controller";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const s3Client = new S3Client({ region: "us-east-1" });

// Cancel upload operation
async function uploadWithCancel(bucket, key, body) {
  const abortController = new AbortController();

  // Setup cancel button handler
  const cancelButton = document.querySelector('.cancel-upload');
  cancelButton.addEventListener('click', () => {
    abortController.abort();
    console.log("Upload canceled by user");
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body
  });

  try {
    const result = await s3Client.send(command, {
      abortSignal: abortController.signal
    });
    console.log("Upload completed:", result.ETag);
    return result;
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Upload was aborted");
      return null;
    }
    throw error;
  }
}

// Timeout pattern
async function getWithTimeout(bucket, key, timeoutMs) {
  const abortController = new AbortController();

  // Abort after timeout
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, timeoutMs);

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });

  try {
    const result = await s3Client.send(command, {
      abortSignal: abortController.signal
    });
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

// Cancel long-running scan
async function cancelableScan(tableName) {
  const dynamoClient = new DynamoDBClient({ region: "us-west-2" });
  const abortController = new AbortController();

  // Automatically cancel after 30 seconds
  setTimeout(() => abortController.abort(), 30000);

  const command = new ScanCommand({
    TableName: tableName,
    Limit: 1000
  });

  try {
    const result = await dynamoClient.send(command, {
      abortSignal: abortController.signal
    });

    console.log(`Scanned ${result.Items.length} items`);
    return result;
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Scan operation was canceled");
      return { Items: [], Count: 0 };
    }
    throw error;
  }
}

// Race condition: first successful result wins
async function raceRequests(bucket, keys) {
  const abortController = new AbortController();

  const requests = keys.map(key =>
    s3Client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { abortSignal: abortController.signal }
    )
  );

  try {
    const result = await Promise.race(requests);
    // Cancel other requests
    abortController.abort();
    return result;
  } catch (error) {
    abortController.abort();
    throw error;
  }
}

// Usage examples
await uploadWithCancel("my-bucket", "upload.bin", largeFileBuffer);
const result = await getWithTimeout("my-bucket", "file.txt", 5000);
await cancelableScan("LargeTable");
```

## Middleware Stack Customization

### Custom middleware for logging and request modification

Add custom middleware to the request/response lifecycle for logging, authentication, request transformation, and error handling.

```javascript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const s3Client = new S3Client({ region: "us-east-1" });

// Add logging middleware at client level (applies to all commands)
s3Client.middlewareStack.add(
  (next, context) => async (args) => {
    const startTime = Date.now();
    console.log(`[${context.clientName}] Calling ${context.commandName}`);
    console.log("Input:", JSON.stringify(args.input, null, 2));

    try {
      const result = await next(args);
      const duration = Date.now() - startTime;
      console.log(`[${context.clientName}] ${context.commandName} succeeded in ${duration}ms`);
      console.log("Output:", JSON.stringify(result.output, null, 2));
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${context.clientName}] ${context.commandName} failed in ${duration}ms`);
      console.error("Error:", error.name, error.message);
      throw error;
    }
  },
  {
    name: "LoggingMiddleware",
    step: "build",
    priority: "high",
    override: true
  }
);

// Add custom header to all S3 requests
s3Client.middlewareStack.add(
  (next) => async (args) => {
    if (args.request && args.request.headers) {
      args.request.headers["x-custom-header"] = "my-value";
      args.request.headers["x-request-id"] = generateRequestId();
    }
    return next(args);
  },
  {
    name: "CustomHeaderMiddleware",
    step: "build",
    override: true
  }
);

// Add retry logic with custom backoff
s3Client.middlewareStack.add(
  (next) => async (args) => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        return await next(args);
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts || !isRetryable(error)) {
          throw error;
        }

        const delay = Math.pow(2, attempts) * 1000; // Exponential backoff
        console.log(`Retry attempt ${attempts} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },
  {
    name: "CustomRetryMiddleware",
    step: "finalizeRequest",
    priority: "high"
  }
);

// Command-specific middleware
const dynamoClient = new DynamoDBClient({ region: "us-west-2" });
const queryCommand = new QueryCommand({
  TableName: "Users",
  KeyConditionExpression: "userId = :userId",
  ExpressionAttributeValues: { ":userId": { S: "user123" } }
});

// Add middleware before marshalling (modify input)
queryCommand.middlewareStack.addRelativeTo(
  (next) => async (args) => {
    console.log("Pre-marshall input:", args.input);
    // Modify input before sending
    args.input.ConsistentRead = true;
    return next(args);
  },
  {
    relation: "before",
    toMiddleware: "serializerMiddleware",
    name: "InputModificationMiddleware"
  }
);

// Add middleware after unmarshalling (modify output)
queryCommand.middlewareStack.addRelativeTo(
  (next) => async (args) => {
    const result = await next(args);
    console.log("Post-unmarshall output:", result.output);

    // Transform output
    if (result.output.Items) {
      result.output.Items = result.output.Items.map(item => ({
        ...item,
        processedAt: new Date().toISOString()
      }));
    }

    return result;
  },
  {
    relation: "before",
    toMiddleware: "deserializerMiddleware",
    name: "OutputTransformMiddleware"
  }
);

// Authentication middleware
const authenticatedClient = new S3Client({ region: "us-east-1" });

authenticatedClient.middlewareStack.add(
  (next) => async (args) => {
    // Add authentication token
    const token = await getAuthToken();
    if (args.request && args.request.headers) {
      args.request.headers["Authorization"] = `Bearer ${token}`;
    }
    return next(args);
  },
  {
    name: "AuthMiddleware",
    step: "finalizeRequest",
    priority: "high"
  }
);

// Helper functions
function generateRequestId() {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function isRetryable(error) {
  const retryableErrors = [
    "RequestTimeout",
    "RequestTimeoutException",
    "ServiceUnavailable",
    "ThrottlingException"
  ];
  return retryableErrors.includes(error.name);
}

async function getAuthToken() {
  // Fetch token from auth service
  return "mock-token-12345";
}

// Execute commands with middleware
await s3Client.send(new PutObjectCommand({
  Bucket: "my-bucket",
  Key: "test.txt",
  Body: "Hello World"
}));

await dynamoClient.send(queryCommand);
```

## Lambda Integration Best Practices

### Optimizing AWS SDK usage in Lambda functions

Initialize SDK clients outside handler function to leverage container reuse, while making API calls inside handler to ensure fresh credentials.

```javascript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

// Initialize clients OUTSIDE handler for container reuse
const dynamoClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({})
);

const s3Client = new S3Client({});

const snsClient = new SNSClient({});

// Lambda handler
export const handler = async (event) => {
  const response = {
    statusCode: 200,
    headers: { "Content-Type": "application/json" }
  };

  try {
    // Make API calls INSIDE handler
    const userId = event.pathParameters?.userId;

    // Get user from DynamoDB
    const userResult = await dynamoClient.send(new GetCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId }
    }));

    if (!userResult.Item) {
      response.statusCode = 404;
      response.body = JSON.stringify({ error: "User not found" });
      return response;
    }

    // Fetch user's profile image from S3
    const imageKey = `profiles/${userId}/avatar.jpg`;
    const imageResult = await s3Client.send(new GetObjectCommand({
      Bucket: process.env.PROFILE_IMAGES_BUCKET,
      Key: imageKey
    }));

    // Update last accessed timestamp
    await dynamoClient.send(new PutCommand({
      TableName: process.env.USERS_TABLE,
      Item: {
        ...userResult.Item,
        lastAccessedAt: new Date().toISOString()
      }
    }));

    // Send notification
    await snsClient.send(new PublishCommand({
      TopicArn: process.env.NOTIFICATIONS_TOPIC,
      Message: JSON.stringify({
        userId,
        action: "profile_accessed",
        timestamp: new Date().toISOString()
      }),
      Subject: "Profile Access Notification"
    }));

    response.body = JSON.stringify({
      user: userResult.Item,
      imageUrl: await imageResult.Body.transformToString()
    });

  } catch (error) {
    console.error("Error:", error);
    response.statusCode = 500;
    response.body = JSON.stringify({
      error: "Internal Server Error",
      message: error.message
    });
  }

  return response;
};

// Example: Processing S3 events
export const s3EventHandler = async (event) => {
  const promises = event.Records.map(async (record) => {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing ${key} from ${bucket}`);

    // Get object
    const getResult = await s3Client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key
    }));

    const content = await getResult.Body.transformToString();

    // Store metadata in DynamoDB
    await dynamoClient.send(new PutCommand({
      TableName: process.env.FILES_TABLE,
      Item: {
        fileKey: key,
        bucket,
        size: getResult.ContentLength,
        contentType: getResult.ContentType,
        processedAt: new Date().toISOString(),
        lineCount: content.split('\n').length
      }
    }));
  });

  await Promise.all(promises);

  return {
    statusCode: 200,
    body: JSON.stringify({ processed: event.Records.length })
  };
};

// Example: DynamoDB Streams processing
export const streamHandler = async (event) => {
  for (const record of event.Records) {
    console.log("Event:", record.eventName);

    if (record.eventName === "INSERT") {
      const newItem = record.dynamodb.NewImage;
      console.log("New item:", newItem);

      // Process new items
      if (newItem.status?.S === "pending") {
        // Trigger processing workflow
        await snsClient.send(new PublishCommand({
          TopicArn: process.env.PROCESSING_TOPIC,
          Message: JSON.stringify({
            recordId: newItem.id.S,
            action: "process"
          })
        }));
      }
    }

    if (record.eventName === "MODIFY") {
      const oldItem = record.dynamodb.OldImage;
      const newItem = record.dynamodb.NewImage;

      // Detect status changes
      if (oldItem.status?.S !== newItem.status?.S) {
        console.log(`Status changed from ${oldItem.status.S} to ${newItem.status.S}`);
      }
    }
  }

  return { statusCode: 200 };
};
```

The AWS SDK for JavaScript v3 serves as the foundation for building modern cloud applications with AWS services across multiple platforms. Its modular design reduces bundle sizes by 50-80% compared to v2 while improving cold start times in serverless environments. The command pattern architecture enables fine-grained control over which code gets imported, making it ideal for browser-based applications where bundle size directly impacts user experience. With utilities like lib-storage for multipart uploads and lib-dynamodb for simplified document operations, developers can handle complex scenarios with minimal boilerplate code.

Integration patterns center around proper client initialization and lifecycle management. Clients should be created once and reused across operations to leverage connection pooling and credential caching. The middleware stack provides powerful extensibility for cross-cutting concerns like logging, metrics, and authentication without modifying application code. Pagination helpers using async iterators simplify processing large datasets, while native AbortController support (in Node.js 18+) enables responsive user experiences by allowing request cancellation. These patterns, combined with TypeScript's type safety and comprehensive error handling, make the SDK v3 a robust choice for production AWS applications running in Node.js, browsers, or Lambda functions.
