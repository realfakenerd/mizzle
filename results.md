# Benchmark Results

### Scale: Small

| Operation | Ops/sec | Latency (ms) | Mem Delta (MB) | CPU User (ms) | CPU System (ms) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| AWS SDK v3: PutItem | 65.11 | 15.6134 | 2.71 | 588.97 | 433.65 |
| AWS SDK v3: GetItem | 364.96 | 3.1866 | 3.00 | 887.88 | 459.74 |
| AWS SDK v3: UpdateItem | 67.75 | 14.9831 | -26.32 | 486.78 | 532.43 |
| AWS SDK v3: Query | 364.34 | 2.9723 | 3.09 | 895.99 | 353.52 |
| AWS SDK v3: Scan | 42.90 | 23.5307 | 18.69 | 1758.96 | 632.00 |
| AWS SDK v3: DeleteItem | 408.72 | 2.6733 | 4.04 | 877.05 | 231.73 |
| Mizzle: PutItem | 67.93 | 14.9853 | -24.40 | 511.59 | 423.90 |
| Mizzle: GetItem | 329.20 | 3.5227 | 2.84 | 887.88 | 436.50 |
| Mizzle: UpdateItem | 70.42 | 14.3647 | 2.45 | 401.45 | 406.54 |
| Mizzle: Query | 441.32 | 2.4973 | 3.06 | 790.60 | 302.21 |
| Mizzle: Scan | 43.65 | 23.1395 | 12.67 | 1552.82 | 624.77 |
| Mizzle: DeleteItem | 416.43 | 2.6374 | 4.39 | 842.32 | 260.23 |
| Dynamoose: PutItem | 62.98 | 15.9779 | 3.33 | 870.12 | 401.50 |
| Dynamoose: GetItem | 315.52 | 3.5563 | -27.41 | 1146.29 | 376.33 |
| Dynamoose: UpdateItem | 62.77 | 16.0062 | 3.01 | 689.35 | 391.09 |
| Dynamoose: Query | 239.05 | 4.6782 | 2.87 | 1072.03 | 359.61 |
| Dynamoose: Scan | 3.52 | 284.9556 | -1.82 | 32898.90 | 8549.57 |
| Dynamoose: DeleteItem | 348.59 | 3.1799 | 3.02 | 830.88 | 292.86 |
| ElectroDB: PutItem | 64.00 | 15.8358 | 3.48 | 704.97 | 453.62 |
| ElectroDB: GetItem | 355.85 | 3.1687 | 3.16 | 1042.52 | 337.71 |
| ElectroDB: UpdateItem | 63.21 | 15.9475 | 3.19 | 842.76 | 401.06 |
| ElectroDB: Query | 312.74 | 3.5633 | -14.14 | 887.07 | 389.37 |
| ElectroDB: Scan | 89.82 | 11.4159 | 2.63 | 552.99 | 260.67 |
| ElectroDB: DeleteItem | 377.44 | 2.9031 | 2.73 | 690.88 | 392.04 |

