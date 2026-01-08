# Benchmark Results

### Scale: Small

| Operation | Ops/sec | Latency (ms) | Mem Delta (MB) | CPU User (ms) | CPU System (ms) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| AWS SDK v3: PutItem | 59.06 | 17.4394 | 2.26 | 588.72 | 448.60 |
| Mizzle: PutItem | 63.41 | 16.1463 | 2.25 | 477.19 | 445.06 |
| Dynamoose: PutItem | 56.18 | 18.2744 | 2.40 | 934.17 | 412.30 |
| ElectroDB: PutItem | 62.49 | 16.1168 | 2.77 | 624.36 | 438.73 |
| AWS SDK v3: GetItem | 346.75 | 3.1604 | 2.22 | 640.85 | 228.75 |
| Mizzle: GetItem | 357.60 | 3.0122 | 2.34 | 586.61 | 282.23 |
| Dynamoose: GetItem | 283.41 | 3.7964 | 2.12 | 711.39 | 259.98 |
| ElectroDB: GetItem | 328.67 | 3.2561 | 2.48 | 580.04 | 270.17 |
| AWS SDK v3: UpdateItem | 68.05 | 14.8693 | 2.07 | 381.61 | 364.09 |
| Mizzle: UpdateItem | 62.23 | 55.6734 | -13.12 | 465.63 | 384.58 |
| Dynamoose: UpdateItem | 62.73 | 16.0202 | 2.75 | 576.40 | 324.16 |
| ElectroDB: UpdateItem | 62.88 | 15.9741 | 3.00 | 545.52 | 324.83 |
| AWS SDK v3: Query | 310.11 | 3.4266 | 2.17 | 477.96 | 311.15 |
| Mizzle: Query | 349.08 | 3.1875 | 2.21 | 578.40 | 261.09 |
| Dynamoose: Query | 211.57 | 5.3857 | 2.02 | 760.81 | 288.08 |
| ElectroDB: Query | 290.56 | 3.9701 | -14.73 | 654.04 | 315.85 |
| AWS SDK v3: Scan | 37.86 | 26.8923 | -8.80 | 1547.27 | 754.43 |
| Mizzle: Scan | 36.99 | 27.6092 | 3.88 | 1654.38 | 645.97 |
| Dynamoose: Scan | 3.55 | 283.3665 | 6.12 | 28106.75 | 7229.98 |
| ElectroDB: Scan | 87.45 | 11.8738 | 2.89 | 376.69 | 361.87 |
| AWS SDK v3: DeleteItem | 382.99 | 3.1361 | -17.40 | 650.24 | 296.69 |
| Mizzle: DeleteItem | 386.74 | 2.9963 | 2.05 | 582.68 | 351.24 |
| Dynamoose: DeleteItem | 343.43 | 3.3712 | 2.02 | 932.11 | 303.24 |
| ElectroDB: DeleteItem | 364.27 | 3.0133 | 2.22 | 697.96 | 244.76 |

