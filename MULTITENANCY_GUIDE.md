# Multitenancy & Security Guide

This document explains the technical architecture used to achieve secure data isolation (Multitenancy) in the Entry Fleet Management Dashboard.

## 1. Core Architecture: The "Fleet" Model
The project uses a **Shared Database, Isolated Rows** approach.

*   **`fleets`**: This is the root of the multitenant structure. Each company or organization is a "Fleet".
*   **`user_profiles`**: Links a Supabase Auth user to a specific `fleet_id`. This determines what a user can see.
*   **`vehicles`**: Each vehicle belongs to a `fleet_id`.
*   **`devices` & `events`**: These are linked to a vehicle, and thus indirectly belong to a fleet.

## 2. Security Engine: Row Level Security (RLS)
The isolation is enforced at the database level using Supabase (PostgreSQL) RLS. This ensures that even if a bug in the frontend tries to request all data, the database will only return what the user is allowed to see.

### Helper Functions
Two critical functions facilitate the policies:
*   `get_user_fleet_id()`: Retrieves the `fleet_id` associated with the current `auth.uid()`.
*   `is_superadmin()`: Checks if the user has the 'superadmin' role to bypass restrictions (useful for global maintenance).

### Policies Example
```sql
-- Only allow users to see vehicles belonging to their fleet
CREATE POLICY "Vehiculos: Acceso por flota" ON vehicles 
FOR ALL USING (
  (fleet_id = get_user_fleet_id() AND get_user_fleet_id() IS NOT NULL) 
  OR is_superadmin()
);
```

## 3. The "Security Invoker" Configuration (Critical Fix)
By default, PostgreSQL **Views** are executed with the permissions of the user who created them (usually `postgres`). This causes a security leak where a view like `vehicles_with_status` shows ALL data regardless of RLS.

To fix this, we implement **Security Invoker Views**:
```sql
CREATE OR REPLACE VIEW vehicles_with_status 
WITH (security_invoker = true) AS 
-- ... query
```
The `WITH (security_invoker = true)` clause forces the View to respect the RLS policies of the underlying tables based on the user currently logged in.

## 4. Verification of Isolation
During testing, we verified isolation using two disjoint data sets:
1.  **Fleet A (Kingston)**: 100 vehicles. User: `arivalladares2.0@gmail.com`.
2.  **Fleet B (Montego Bay)**: 50 vehicles. User: `arimetalhead96@gmail.com`.

**Result**: When logged in as User B, User A's 100 vehicles are completely invisible (404/Empty result), confirming that the multitenancy is functional and secure.

## 5. IoT Ingestion Bypass
Data coming from IoT devices (via GPRS/Gulp) bypasses RLS using the `service_role` key. This allows the backend to insert telemetry for any vehicle while keeping the dashboard users limited to their own fleet's data.
