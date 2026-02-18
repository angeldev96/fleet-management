# Entry MVP - Technical Reference & Execution Guide

> **Internal Use Only | Binding Execution Document**  
> **Demo Target Date:** February 4, 2026  
> **Last Updated:** January 2025

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Scope Definition](#3-scope-definition)
4. [Data Contract](#4-data-contract)
5. [Event Types & Severity](#5-event-types--severity)
6. [Frontend Specifications](#6-frontend-specifications)
7. [Map Integration](#7-map-integration)
8. [UI/UX Rules](#8-uiux-rules)
9. [Environment Setup](#9-environment-setup)
10. [Execution Checklists](#10-execution-checklists)
11. [Development Rules](#11-development-rules)
12. [Risk Management](#12-risk-management)
13. [Definition of Done](#13-definition-of-done)

---

## 1. Project Overview

### What is Entry?

Entry is a **fleet intelligence platform** that allows fleet operators to:

- ✅ Visually track vehicles in real time on a map
- ✅ Detect risky driving and collision-related events
- ✅ View basic vehicle diagnostics (DTCs and selected PIDs)
- ✅ Onboard fleets quickly using OBD-only devices
- ✅ Pay a predictable monthly cost per vehicle

### What Entry is NOT (MVP Scope)

The MVP explicitly **excludes**:

- ❌ Address search or reverse geocoding
- ❌ AI-driven recommendations
- ❌ Driver scoring or insurance attribution
- ❌ Predictive maintenance
- ❌ Compliance automation

### Scope Filter

If a feature does not directly support:
- Tracking
- Driver behavior
- Collision visibility
- Diagnostics

**→ It is OUT OF SCOPE.**

---

## 2. System Architecture

```
┌─────────────────────────────────────┐
│     Sinocastel D-218L (OBD)         │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│        TCP Ingestion Server         │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│         Protocol Decoder            │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│   Event Normalizer (REST API?)      │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│     Supabase (Postgres + RLS)       │
│         - events table              │
│         - vehicles table            │
│         - devices table             │
│         - fleets table              │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  React Dashboard (Material Pro)     │
│         + Mapbox GL                 │
└─────────────────────────────────────┘
```

### Data Flow Principle

> **The device sends raw telemetry and flags, not business meaning.**
> 
> Entry normalizes all incoming data into semantic events, derives severity server-side, and presents non-judgmental, enterprise-safe language in the UI.

**Raw protocol values are NEVER exposed to:**
- Supabase consumers
- Frontend
- Customers

---

## 3. Scope Definition

### My Responsibilities (Supabase + Frontend)

#### Supabase Engineer Scope
| Area | Ownership |
|------|-----------|
| Supabase project setup | ✅ |
| Database schema design | ✅ |
| Row-Level Security (RLS) | ✅ |
| High-ingestion performance | ✅ |
| Indexing & retention policies | ✅ |
| Fleet data isolation | ✅ |

#### Frontend Engineer Scope
| Area | Ownership |
|------|-----------|
| React dashboard (Material Dashboard Pro) | ✅ |
| Map integration (Mapbox GL) | ✅ |
| Fleet Map page | ✅ |
| Vehicle detail views | ✅ |
| Events feed | ✅ |
| Diagnostics UI (DTC/PIDs) | ✅ |

### Success Criteria

**Supabase:**
- Data isolation is enforced
- Ingestion does not bottleneck
- Queries are map-friendly and fast

**Frontend:**
- Fleet manager can understand system without training
- Map is usable, responsive, and stable
- Demo runs without developer intervention

---

## 4. Data Contract

> ⚠️ **This contract must not be broken. It prevents frontend & backend divergence.**

### Required Event Fields

```json
{
  "event_type": "string (enum)",
  "event_subtype": "string | null",
  "severity": "string (enum)",
  "vehicle_id": "uuid",
  "device_id": "uuid",
  "timestamp": "ISO-8601 (Central Time/UTC)",
  "latitude": "number",
  "longitude": "number",
  "raw_payload": "jsonb (retained for audit/debug only)"
}
```

### Field Specifications

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `device_id` | UUID | ✅ | Foreign key to devices |
| `vehicle_id` | UUID | ✅ | Foreign key to vehicles |
| `event_type` | TEXT (enum) | ✅ | See Event Types section |
| `event_subtype` | TEXT | ❌ | Additional classification |
| `severity` | TEXT (enum) | ✅ | `info`, `warning`, `critical` |
| `timestamp` | TIMESTAMPTZ | ✅ | ISO-8601 format |
| `latitude` | DECIMAL | ✅ | GPS coordinate |
| `longitude` | DECIMAL | ✅ | GPS coordinate |
| `raw_payload` | JSONB | ✅ | Never exposed to frontend |

---




## 5. Event Types & Severity

### Event Type ENUM (Authoritative)

| Event Type | Description | Protocol Source |
|------------|-------------|-----------------|
| `location_update` | Periodic GPS telemetry | GPS packet (0x4001) |
| `overspeed` | Speed exceeds threshold | Server-derived |
| `harsh_braking` | G-sensor deceleration spike | Device event |
| `harsh_acceleration` | G-sensor acceleration spike | Device event |
| `harsh_cornering` | Lateral G-sensor spike | Optional MVP |
| `collision_detected` | Impact / collision flag | Native device support |
| `dtc_detected` | Fault code present | DTC packet (0x4006) |
| `device_online` | Heartbeat resumes | State change |
| `device_offline` | Heartbeat timeout | Time-based |
| `power_event` | Power reset / unplug | OBD power behavior |

> ❗ **Do not expose protocol IDs (e.g., 0x4001) outside ingestion.**

### Severity ENUM (Authoritative)

| Severity | Meaning |
|----------|---------|
| `info` | Informational |
| `warning` | Attention required |
| `critical` | Immediate attention |

### Severity Derivation Rules

> ⚠️ **The device does NOT send severity. Severity is derived during normalization (server-side).**

| event_type | Default Severity | Escalation Rule |
|------------|------------------|-----------------|
| `location_update` | `info` | — |
| `device_online` | `info` | — |
| `overspeed` | `warning` | — |
| `harsh_braking` | `warning` | — |
| `harsh_acceleration` | `warning` | — |
| `harsh_cornering` | `warning` | — |
| `dtc_detected` | `warning` | → `critical` if high-risk DTC |
| `device_offline` | `warning` | → `critical` after 30 min |
| `power_event` | `warning` | — |
| `collision_detected` | `critical` | — |

### Offline Escalation Rule

```
Device offline 5 minutes  → severity: warning
Device offline 30 minutes → severity: critical
```

---

## 6. Frontend Specifications

### Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React |
| UI Kit | Material Dashboard Pro |
| Maps | Mapbox GL JS |

### Pages Required

| Page | Priority | Description |
|------|----------|-------------|
| Fleet Map | 🔴 Critical | Real-time vehicle visualization |
| Vehicles List | 🟡 High | All vehicles in fleet |
| Vehicle Detail | 🟡 High | Single vehicle info + history |
| Event Feed | 🟡 High | Chronological event list |
| Diagnostics | 🟢 Medium | DTC and PID display |

### Data Handling Requirements

| Requirement | Implementation |
|-------------|----------------|
| Update frequency | Polling every 10-30 seconds |
| Loading states | Required on all data fetches |
| Error states | Required, graceful degradation |
| Bad data handling | UI must NOT crash |
| Empty states | Informative, not broken |

---

## 7. Map Integration

### Technology Decision (LOCKED)

- ✅ **Mapbox GL JS** via `react-map-gl`
- ❌ No address search
- ❌ No reverse geocoding
- ✅ GPS-only visualization

### Fleet Map Purpose

The Fleet Map provides **situational awareness**, not analytics.

It answers:
- Where are my vehicles?
- Which are online?
- Which have recent alerts?

### Functional Requirements

| Requirement | Specification |
|-------------|---------------|
| Layout | Inside Material Dashboard layout |
| Load time | < 3 seconds |
| Vehicle display | All vehicles with valid GPS |
| Interactions | Zoom, pan |
| Clustering | Required for 100+ vehicles |
| Update method | Polling (10-30s interval) |
| Fallback | Map must load even if data is missing |

### Mapbox Configuration Checklist

- [ ] Mapbox account created
- [ ] Billing enabled + usage alerts set
- [ ] Public Mapbox token generated
- [ ] Token restricted by domain
- [ ] Token stored in environment variables
- [ ] Base map style selected and locked
- [ ] Default map center + zoom defined

### Vehicle Marker Logic

#### Marker Status Colors

| Status | Color | Condition |
|--------|-------|-----------|
| 🟢 Online | Green | Recent heartbeat |
| 🔴 Offline | Red | Heartbeat timeout |
| ⚠️ Alert | Amber | Recent driver behavior or collision event |

#### Marker Priority (when multiple conditions)

```
Critical alert → Red
Warning alert  → Amber  
No alerts      → Green (if online) / Gray (if offline)
```

### Marker Click Interaction

On marker click, display:

| Field | Required |
|-------|----------|
| Vehicle identifier | ✅ |
| Online/offline status | ✅ |
| Last reported timestamp | ✅ |
| Most recent event (if any) | ✅ |

> No editing actions required in MVP.

---

## 8. UI/UX Rules

### Severity Badge Colors

| Severity | Color Name | Hex Code | Text Color |
|----------|------------|----------|------------|
| `info` | Blue | `#1A73E8` | White |
| `warning` | Amber | `#F9A825` | Dark/Black |
| `critical` | Red | `#D32F2F` | White |

### Color Tokens (for theming)

```javascript
const severityColors = {
  info: {
    background: '#1A73E8',
    text: '#FFFFFF'
  },
  warning: {
    background: '#F9A825',
    text: '#212121'
  },
  critical: {
    background: '#D32F2F',
    text: '#FFFFFF'
  }
};
```

### Animation Rules

| Severity | Animation |
|----------|-----------|
| Critical | Subtle pulse (optional) |
| Warning | Static |
| Info | Static |

> ❌ **No flashing, blinking, or alarmist effects.**

### Approved UI Wording

| event_type | UI Display Text |
|------------|-----------------|
| `harsh_braking` | "Harsh braking detected" |
| `harsh_acceleration` | "Rapid acceleration detected" |
| `harsh_cornering` | "Sharp turn detected" |
| `overspeed` | "Speed threshold exceeded" |
| `collision_detected` | "Potential collision detected" |
| `dtc_detected` | "Vehicle diagnostic fault detected" |
| `device_offline` | "Device not reporting" |
| `device_online` | "Device connected" |
| `power_event` | "Power event detected" |
| `location_update` | "Location updated" |

### Severity Tooltips

| Severity | Tooltip Text |
|----------|--------------|
| `info` | "This event is informational and does not require action." |
| `warning` | "This event may require attention." |
| `critical` | "Immediate attention recommended." |

### ❌ FORBIDDEN Language

Never use these terms in the UI:

- ❌ "accident"
- ❌ "crash confirmed"
- ❌ "driver fault"
- ❌ "unsafe driving"
- ❌ "reckless"
- ❌ "dangerous"
- ❌ Any insurance attribution language

---

## 9. Environment Setup

### Environment Variables

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Mapbox
REACT_APP_MAPBOX_TOKEN=your-mapbox-token

# App Config
REACT_APP_ENVIRONMENT=development | demo | production
REACT_APP_POLLING_INTERVAL=15000  # milliseconds

# IoT (for reference)
TCP_PORT=your-tcp-port
DEVICE_SECRET_KEY=your-device-secret
```

### Environments Required

| Environment | Purpose |
|-------------|---------|
| `development` | Local development |
| `demo` | Customer demo (Feb 4, 2026) |



### Branch Rules

| Branch | Purpose |
|--------|---------|
| `main` | Demo-ready only |
| `dev` | Active development |

---

## 10. Execution Checklists

### Supabase Engineer Checklist

#### Project Setup
- [ ] Create Supabase project (Pro plan)
- [ ] Configure environments (dev/demo)
- [ ] Set up service role access for ingestion
- [ ] Configure environment variables


#### Security & Isolation
- [ ] Implement Row Level Security (RLS)
- [ ] Ensure fleet-level data isolation
- [ ] Validate users cannot see other fleets' data
- [ ] Secure ingestion paths appropriately

#### Performance & Maintenance
- [ ] Add index: `vehicle_id`
- [ ] Add index: `event_type`
- [ ] Add index: `timestamp`
- [ ] Add index: `latitude/longitude`
- [ ] Define retention policy for old events
- [ ] Validate query performance for map & feeds
- [ ] Monitor write performance under load

---

### Frontend Engineer Checklist

#### Dashboard Foundation
- [ ] Set up Material Dashboard Pro React
- [ ] Configure routing and navigation
- [ ] Integrate authentication with Supabase
- [ ] Confirm role-based access works

#### Fleet Map Page (CRITICAL PATH)
- [ ] Integrate Mapbox GL (`react-map-gl`)
- [ ] Configure Mapbox API token
- [ ] Render base map inside dashboard layout
- [ ] Display vehicle markers based on GPS data
- [ ] Implement marker clustering
- [ ] Apply marker color logic (Online/Offline/Alert)
- [ ] Implement marker click interaction
- [ ] Ensure map loads with partial or missing data

#### Supporting Pages
- [ ] Vehicles list page
- [ ] Vehicle detail page
- [ ] Event feed page
- [ ] Diagnostics section: DTC display
- [ ] Diagnostics section: PID snapshot display

#### Data Handling
- [ ] Implement polling (10-30s) for updates
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Ensure UI does not crash on bad data
- [ ] Optimize queries for responsiveness

#### Demo Readiness
- [ ] Validate UI works on desktop browsers
- [ ] Validate performance with 100 vehicles
- [ ] Ensure no console errors during demo
- [ ] Support demo dry runs

---

## 11. Development Rules

### Non-Negotiable Principles

| # | Rule |
|---|------|
| 1 | Demo stability > feature completeness |
| 2 | Clarity > cleverness |
| 3 | Fail visibly, never silently |
| 4 | One schema, one data contract |
| 5 | No new features after Week 2 |
| 6 | Map must always load even if data is missing |

### Critical Constraints

| Constraint | Enforcement |
|------------|-------------|
| Frontend does NOT calculate severity | Severity comes from database |
| Raw protocol values NOT shown to users | Filtered at query level |
| No fault attribution | Enterprise-safe language only |
| All alerts originate from normalized events | No frontend-generated alerts |

### Timeline (2 + 1 Model)

**Week 1: Build**
- Parallel workstreams
- Core ingestion, map, events, diagnostics
- Scope strictly enforced

**Week 2: Testing & Validation**
- Device dropout testing
- False event validation
- Installer dry runs
- Demo rehearsal
- Fallback data preparation

---

## 12. Risk Management

### Known Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| False collision positives | Customer distrust | Conservative thresholds, label as "Potential" |
| G-sensor sensitivity | False events | Tune thresholds server-side |
| GPS jitter | Map artifacts | Smooth/filter coordinates |
| Data bursts | Performance issues | Indexing, batch processing |
| Device connectivity | Demo failure | Fallback demo data |

### Mitigation Strategies

1. **Conservative thresholds** - Better to miss than false positive
2. **Label events as "Potential"** - No definitive claims
3. **No insurance language** - Legal protection
4. **Retain raw payloads** - Debugging capability
5. **Fallback demo data** - Demo never fails

---

## 13. Definition of Done

### MVP is complete when:

- [ ] 100 vehicles can be onboarded via batch
- [ ] Devices stream data reliably
- [ ] Fleet Map shows live or replayed data
- [ ] Events and diagnostics are visible
- [ ] Demo runs without engineers present
- [ ] Dashboard usable without explanation
- [ ] Driver behavior & collision events visible
- [ ] DTCs and PIDs visible per vehicle

---

## Quick Reference Cards

### Event Type Quick Reference
```
location_update | overspeed | harsh_braking | harsh_acceleration
harsh_cornering | collision_detected | dtc_detected
device_online | device_offline | power_event
```

### Severity Quick Reference
```
info     → Blue   (#1A73E8) → Informational
warning  → Amber  (#F9A825) → Attention required  
critical → Red    (#D32F2F) → Immediate attention
```

### Marker Color Quick Reference
```
🟢 Green  → Online, no alerts
🟡 Amber  → Warning alert active
🔴 Red    → Critical alert OR offline
```

---

