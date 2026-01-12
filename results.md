# Benchmark Results

### Scale: Small

| Operation | Ops/sec | Latency (ms) | Mem Delta (MB) | CPU User (ms) | CPU System (ms) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| AWS SDK v3: PutItem | 67.25 | 15.3974 | 2.21 | 555.93 | 409.22 |
| Mizzle: PutItem | 69.08 | 14.8614 | 2.23 | 441.61 | 370.50 |
| Dynamoose: PutItem | 63.37 | 15.9014 | 2.40 | 778.64 | 360.46 |
| ElectroDB: PutItem | 62.10 | 16.5936 | 2.68 | 702.30 | 435.75 |
| AWS SDK v3: GetItem | 401.23 | 2.8825 | 2.31 | 689.12 | 271.15 |
| Mizzle: GetItem | 374.47 | 3.1298 | 2.44 | 688.41 | 330.20 |
| Dynamoose: GetItem | 300.39 | 3.7823 | 2.15 | 833.56 | 318.64 |
| ElectroDB: GetItem | 369.89 | 3.0919 | 2.51 | 735.05 | 210.41 |
| AWS SDK v3: UpdateItem | 69.53 | 14.6439 | 2.00 | 379.98 | 360.77 |
| Mizzle: UpdateItem | 65.84 | 15.4020 | 2.22 | 507.33 | 291.32 |
| Dynamoose: UpdateItem | 59.68 | 17.1563 | -14.38 | 787.28 | 476.44 |
| ElectroDB: UpdateItem | 62.29 | 16.3222 | 2.96 | 630.73 | 338.99 |
| AWS SDK v3: Query | 348.76 | 3.3026 | 2.17 | 634.40 | 220.93 |
| Mizzle: Query | 377.21 | 3.1605 | 2.26 | 715.77 | 306.60 |
| Dynamoose: Query | 229.73 | 5.0154 | 2.14 | 944.37 | 341.00 |
| ElectroDB: Query | 210.00 | 5.5712 | 2.10 | 779.94 | 284.78 |
| AWS SDK v3: Scan | 31.67 | 33.0500 | -4.37 | 2020.67 | 788.53 |
| Mizzle: Scan | 30.61 | 33.8503 | 0.06 | 2251.91 | 624.76 |
| Dynamoose: Scan | 2.58 | 396.4886 | 9.58 | 39281.89 | 9540.22 |
| ElectroDB: Scan | 65.99 | 15.9289 | 2.97 | 650.49 | 436.35 |
| AWS SDK v3: DeleteItem | 309.22 | 3.8924 | 1.83 | 685.20 | 294.83 |
| Mizzle: DeleteItem | 335.63 | 3.5450 | 1.92 | 572.79 | 347.68 |
| Dynamoose: DeleteItem | 300.61 | 3.9527 | -18.87 | 725.52 | 325.10 |
| ElectroDB: DeleteItem | 312.02 | 3.7151 | 2.07 | 884.08 | 269.94 |

### Scale: Large

| Operation | Ops/sec | Latency (ms) | Mem Delta (MB) | CPU User (ms) | CPU System (ms) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| AWS SDK v3: PutItem | 69.89 | 14.5478 | 1.46 | 251.86 | 281.38 |
| Mizzle: PutItem | 69.87 | 14.5741 | 1.52 | 299.40 | 221.22 |
| Dynamoose: PutItem | 57.74 | 17.6196 | 1.30 | 488.06 | 190.70 |
| ElectroDB: PutItem | 67.50 | 15.1042 | 1.65 | 335.67 | 272.84 |
| AWS SDK v3: GetItem | 427.77 | 2.6903 | -13.94 | 672.49 | 252.42 |
| Mizzle: GetItem | 435.54 | 2.5908 | 2.50 | 530.27 | 339.19 |
| Dynamoose: GetItem | 225.70 | 6.4245 | 2.93 | 985.73 | 421.88 |
| ElectroDB: GetItem | 368.49 | 3.0804 | 2.48 | 677.32 | 245.34 |
| AWS SDK v3: UpdateItem | 67.52 | 15.0464 | 1.38 | 323.05 | 198.80 |
| Mizzle: UpdateItem | 69.03 | 14.6993 | 1.52 | 410.81 | 205.17 |
| Dynamoose: UpdateItem | 57.41 | 17.6839 | 1.45 | 524.62 | 208.75 |
| ElectroDB: UpdateItem | 64.00 | 15.7712 | 1.64 | 431.73 | 262.92 |
| AWS SDK v3: Query | 357.08 | 3.1781 | 2.29 | 589.37 | 309.35 |
| Mizzle: Query | 402.31 | 2.8306 | 2.48 | 758.65 | 185.01 |
| Dynamoose: Query | 177.70 | 7.4194 | 2.42 | 893.52 | 521.11 |
| ElectroDB: Query | 299.17 | 3.8077 | 2.35 | 688.64 | 306.77 |
| AWS SDK v3: Scan | 5.77 | 174.7056 | -9.01 | 778.74 | 371.34 |
| Mizzle: Scan | 5.82 | 172.1184 | 0.19 | 1235.85 | 151.96 |
| Dynamoose: Scan | 0.66 | 1553.1757 | 17.75 | 15818.84 | 2311.11 |
| ElectroDB: Scan | 10.43 | 96.6593 | 2.40 | 237.56 | 85.84 |
| AWS SDK v3: DeleteItem | 365.00 | 3.2436 | 2.01 | 644.78 | 317.70 |
| Mizzle: DeleteItem | 353.55 | 3.5494 | 1.94 | 837.87 | 314.77 |
| Dynamoose: DeleteItem | 329.74 | 3.5003 | 1.83 | 608.10 | 343.78 |
| ElectroDB: DeleteItem | 369.85 | 3.1021 | -37.10 | 675.72 | 278.19 |

