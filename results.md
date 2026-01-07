# Benchmark Results

### Scale: Small

| Operation | Ops/sec | Latency (ms) | Mem Delta (MB) | CPU User (ms) | CPU System (ms) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| AWS SDK v3: PutItem | 42.42 | 26.5456 | 3.31 | 1490.81 | 930.09 |
| AWS SDK v3: GetItem | 157.97 | 9.9110 | 1.94 | 995.49 | 621.91 |
| AWS SDK v3: UpdateItem | 47.79 | 22.6026 | 2.68 | 1490.84 | 865.52 |
| AWS SDK v3: Query | 210.19 | 5.8274 | 2.43 | 952.47 | 478.57 |
| AWS SDK v3: Scan | 28.36 | 37.8475 | -4.67 | 2992.76 | 1038.34 |
| AWS SDK v3: DeleteItem | 340.53 | 3.4266 | 3.95 | 859.00 | 373.99 |
| Mizzle: PutItem | 66.96 | 15.5629 | 2.63 | 618.99 | 377.07 |
| Mizzle: GetItem | 393.77 | 2.8697 | 2.95 | 807.59 | 344.99 |
| Mizzle: UpdateItem | 71.79 | 14.1453 | -14.52 | 462.16 | 419.58 |
| Mizzle: Query | 420.67 | 2.6023 | 3.25 | 765.51 | 328.53 |
| Mizzle: Scan | 42.39 | 23.9383 | 23.92 | 1598.65 | 684.75 |
| Mizzle: DeleteItem | 398.72 | 2.7331 | -26.66 | 838.47 | 293.49 |
| Dynamoose: PutItem | 62.66 | 16.1767 | 3.49 | 986.92 | 350.54 |
| Dynamoose: GetItem | 310.50 | 3.5427 | 2.91 | 1010.29 | 390.62 |
| Dynamoose: UpdateItem | 61.88 | 17.2183 | 2.93 | 741.28 | 437.15 |
| Dynamoose: Query | 224.63 | 5.0904 | 2.60 | 1143.58 | 350.11 |
| Dynamoose: Scan | 2.86 | 396.0160 | -5.63 | 44910.74 | 10164.30 |
| Dynamoose: DeleteItem | 139.41 | 10.2563 | 1.96 | 1058.10 | 622.34 |
| ElectroDB: PutItem | 59.43 | 17.2587 | 3.51 | 1035.66 | 463.61 |
| ElectroDB: GetItem | 331.79 | 3.6113 | 3.11 | 1034.25 | 378.89 |
| ElectroDB: UpdateItem | 62.91 | 16.1225 | 3.20 | 725.33 | 488.58 |
| ElectroDB: Query | 282.29 | 4.0017 | -14.04 | 924.31 | 401.65 |
| ElectroDB: Scan | 74.60 | 14.0736 | 2.92 | 660.03 | 440.09 |
| ElectroDB: DeleteItem | 332.82 | 3.5504 | 2.62 | 1064.10 | 343.85 |

