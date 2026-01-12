# Implementation Plan: Date / Timestamp (date) Column Type

## Phase 1: Core Column Definition & Serialization
- [x] Task: Define `DateColumn` class and `date()` builder function [196cc8f]
    - [x] Write tests for `date()` column serialization (Date/string/number input to ISO string storage)
    - [x] Write tests for `date()` column deserialization (ISO string storage to Date object output)
    - [x] Implement `DateColumn` logic and serialization/deserialization to pass tests
- [x] Task: Ensure Type Safety [196cc8f]
    - [x] Verify TypeScript inferred types for input (Date | string | number) and output (Date)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Core Column Definition & Serialization' (Protocol in workflow.md) [checkpoint: f2c6d1b]

## Phase 2: Automatic Timestamps (createdAt/updatedAt)
- [x] Task: Implement `defaultNow` (createdAt) [196cc8f]
    - [x] Write tests for automatic current timestamp injection on `put` operations when the value is missing
    - [x] Implement `defaultNow()` builder method and integration in `PutItem` builder
- [x] Task: Implement `onUpdateNow` (updatedAt) [196cc8f]
    - [x] Write tests for automatic current timestamp injection on `update` operations
    - [x] Implement `onUpdateNow()` builder method and integration in `UpdateItem` builder
- [x] Task: Conductor - User Manual Verification 'Phase 2: Automatic Timestamps' (Protocol in workflow.md) [checkpoint: f2c6d1b]

## Phase 3: Integration & Integration Tests
- [x] Task: PK/SK Integration and Sort Verification [196cc8f]
    - [x] Write integration tests using `date()` columns as Partition or Sort Keys
    - [x] Verify correct alphabetical/chronological sorting in DynamoDB local
- [x] Task: Reserved Word Handling [196cc8f]
    - [x] Write tests using common date-related reserved words (e.g., `date`, `timestamp`) as column names
    - [x] Ensure internal Expression Builder handles them correctly via name placeholders
- [x] Task: Conductor - User Manual Verification 'Phase 3: Integration & Integration Tests' (Protocol in workflow.md) [checkpoint: f2c6d1b]
