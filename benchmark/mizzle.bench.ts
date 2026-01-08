import { bench, describe, beforeAll, afterAll } from 'vitest'
import { MizzleBench } from './mizzle-bench'
import { AWSSDKBench } from './sdk-bench'
import { DynamooseBench } from './dynamoose-bench'
import { ElectroDBBench } from './electrodb-bench'
import { DataGenerator } from './data-gen'
import { createTable, deleteTable, waitForTable } from './setup'

// Initialize competitors at the top level to ensure they are defined during bench warmup
const mizzleBench = new MizzleBench()
const sdkBench = new AWSSDKBench()
const dynamooseBench = new DynamooseBench()
const electrodbBench = new ElectroDBBench()
const gen = new DataGenerator()
const item = gen.generateBatch(1)[0]!

const options = { 
  time: 1000,
  iterations: 20,
  warmupTime: 200,
  warmupIterations: 5,
  throws: true // Keep throws enabled to catch hidden errors
}

describe('ORM Comparison: PutItem', () => {
  beforeAll(async () => {
    try {
      await deleteTable()
      await createTable()
      await waitForTable()
    } catch (e) {
      console.error('Setup failed:', e)
    }
  })

  afterAll(async () => {
    try {
      await deleteTable()
    } catch (e) {
      // Ignore
    }
  })

  bench('Mizzle', async () => {
    await mizzleBench.putItem(item)
  }, options)

  bench('AWS SDK', async () => {
    await sdkBench.putItem(item)
  }, options)

  bench('Dynamoose', async () => {
    await dynamooseBench.putItem(item)
  }, options)

  bench('ElectroDB', async () => {
    await electrodbBench.putItem(item)
  }, options)
})

describe('ORM Comparison: GetItem', () => {
  beforeAll(async () => {
    // Ensure item exists
    await sdkBench.putItem(item)
  })

  bench('Mizzle', async () => {
    await mizzleBench.getItem(item.pk, item.sk)
  }, options)

  bench('AWS SDK', async () => {
    await sdkBench.getItem(item.pk, item.sk)
  }, options)

  bench('Dynamoose', async () => {
    await dynamooseBench.getItem(item.pk, item.sk)
  }, options)

  bench('ElectroDB', async () => {
    await electrodbBench.getItem(item.pk, item.sk)
  }, options)
})