# Implementation Plan: Date / Timestamp (date) Column Type

## Phase 1: Core Column Definition & Serialization
- [~] Task: Define `DateColumn` class and `date()` builder function
    - [ ] Write tests for `date()` column serialization (Date/string/number input to ISO string storage)
    - [ ] Write tests for `date()` column deserialization (ISO string storage to Date object output)
    - [ ] Implement `DateColumn` logic and serialization/deserialization to pass tests
- [ ] Task: Ensure Type Safety
    - [ ] Verify TypeScript inferred types for input (Date | string | number) and output (Date)
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Core Column Definition & Serialization' (Protocol in workflow.md)

## Phase 2: Automatic Timestamps (createdAt/updatedAt)
- [ ] Task: Implement `defaultNow` (createdAt)
    - [ ] Write tests for automatic current timestamp injection on `put` operations when the value is missing
    - [ ] Implement `defaultNow()` builder method and integration in `PutItem` builder
- [ ] Task: Implement `onUpdateNow` (updatedAt)
    - [ ] Write tests for automatic current timestamp injection on `update` operations
    - [ ] Implement `onUpdateNow()` builder method and integration in `UpdateItem` builder
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Automatic Timestamps' (Protocol in workflow.md)

## Phase 3: Integration & Integration Tests
- [ ] Task: PK/SK Integration and Sort Verification
    - [ ] Write integration tests using `date()` columns as Partition or Sort Keys
    - [ ] Verify correct alphabetical/chronological sorting in DynamoDB local
- [ ] Task: Reserved Word Handling
    - [ ] Write tests using common date-related reserved words (e.g., `date`, `timestamp`) as column names
    - [ ] Ensure internal Expression Builder handles them correctly via name placeholders
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Integration & Integration Tests' (Protocol in workflow.md)
