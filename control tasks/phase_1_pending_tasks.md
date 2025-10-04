# Phase 1 Foundation - Pending Tasks

This file contains the incomplete or missing tasks from Phase 1 Foundation that need to be implemented.

## GitHub & Repository Setup
- [ ] 1.3 – Add issue templates and PR templates
- [ ] 1.2 – Configure GitHub Actions workflow skeleton (expand beyond infra tests)

## Frontend Infrastructure
- [ ] 2.3 – Setup Redux Toolkit and base slice

## Backend Infrastructure
- [ ] 3.3 – Setup poetry/requirements.txt and linting (switch to UV per rules)

## User Profiles
- [ ] 8.3 – Unit test all profile endpoints (verify comprehensive coverage)

## Goals & Tasks
- [ ] 13.2 – Add validation + API integration for goal form (verify implementation)

## Goal Progress & Milestones
- [ x ] 17.1 – Compute goal progress % (backend)
- [ ] 17.4 – Add user milestones (backend)
- [ ] 18.2 – Add milestone list UI

## Collaboration & Chat
- [ ] 19.1 – Define DynamoDB schema for collaborations
- [ ] 19.2 – Create collaboration invite endpoint
- [ ] 19.3 – Accept/decline invite endpoint
- [ ] 19.4 – List collaborators endpoint
- [ ] 20.1 – Create frontend group creation form
- [ ] 20.2 – Display joined groups list
- [ ] 20.3 – Display group details
- [ ] 21.1 – Setup WebSocket endpoint in FastAPI
- [ ] 21.2 – Implement message persistence in DynamoDB
- [ ] 21.3 – Broadcast messages to connected clients
- [ ] 22.1 – Build chat UI component
- [ ] 22.2 – Connect WebSocket client
- [ ] 22.3 – Add typing indicator & timestamps

---
*Generated: 2025-01-30*
*Total Pending Tasks: 13*

## Recently Completed (2025-01-30)
- [x] 18.1 – User header with active goals count and user menu ✅ FULLY COMPLETED
  - Complete implementation with all planned features plus enhancements
  - Error boundary integration, performance monitoring, enhanced accessibility
  - Comprehensive integration test suite with PowerShell automation

- [x] 17.2 – Add milestone schema (backend) ✅ COMPLETED
  - Updated DynamoDB single-table model documentation with milestone entity pattern
  - Documented schema structure for future persistent storage implementation
  - Added access patterns for milestone queries (GSI1 support)
  - No breaking changes to current dynamic milestone calculation behavior

- [x] 17.3 – Return progress in goal API (verify implementation) ✅ COMPLETED
  - Verified existing progress calculation returns milestone data correctly
  - Confirmed API endpoints include milestone information in responses
  - Validated milestone calculation accuracy and achievement detection
  - All 64 tests passing with no regressions
