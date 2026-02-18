# Supabase Database

This directory contains the database schema, migrations, and configuration for Entry MVP.

## Directory Structure

```
supabase/
├── config.toml              # Supabase CLI configuration
├── migrations/              # Timestamped migration files
│   ├── 20260127000000_initial_schema.sql
│   ├── 20260127195453_add_event_subtype_column.sql
│   └── 20260127195730_update_latest_vehicle_events_view.sql
├── schema/                  # Reference schema files (organized by type)
│   ├── tables/
│   │   ├── fleets.sql
│   │   ├── user_profiles.sql
│   │   ├── vehicles.sql
│   │   ├── devices.sql
│   │   └── events.sql
│   ├── functions/
│   │   ├── get_user_fleet_id.sql
│   │   └── is_superadmin.sql
│   ├── views/
│   │   ├── vehicles_with_status.sql
│   │   └── latest_vehicle_events.sql
│   ├── policies/
│   │   ├── fleets_policies.sql
│   │   ├── user_profiles_policies.sql
│   │   ├── vehicles_policies.sql
│   │   ├── devices_policies.sql
│   │   └── events_policies.sql
│   └── indexes/
│       └── performance_indexes.sql
├── seeds/
│   └── demo_data.sql        # Demo data for testing
└── README.md                # This file
```

## Quick Start

### Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link to project:
   ```bash
   supabase link --project-ref qhsquyccwnmyxpgfigru
   ```

## Working with Migrations

### View Migration Status

```bash
supabase migration list
```

### Create a New Migration

```bash
supabase migration new <migration_name>
```

This creates a new file: `migrations/YYYYMMDDHHMMSS_<migration_name>.sql`

### Apply Migrations to Remote

```bash
supabase db push
```

### Pull Schema from Remote

```bash
supabase db pull
```

### Reset Local Database

```bash
supabase db reset
```

## Migration Best Practices

1. **One change per migration**: Each migration should focus on a single table or feature
2. **Use IF EXISTS/IF NOT EXISTS**: Make migrations idempotent when possible
3. **Never modify applied migrations**: Create new migrations for changes
4. **Test locally first**: Use `supabase start` for local development
5. **Descriptive names**: Use clear names like `add_column_x_to_table_y`

## Schema Reference

The `schema/` directory contains individual SQL files for reference:

- **tables/**: Table definitions with constraints and RLS enablement
- **functions/**: Helper functions for RLS policies
- **views/**: Computed views for common queries
- **policies/**: Row Level Security policies
- **indexes/**: Performance indexes

These files are for reference and documentation. The actual database state is managed through migrations.

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `fleets` | Fleet tenants (multitenancy) |
| `user_profiles` | User profiles linked to auth.users |
| `vehicles` | Vehicles belonging to fleets |
| `devices` | GPS/OBD devices (1:1 with vehicles) |
| `events` | Telemetry events and alerts |

### Views

| View | Description |
|------|-------------|
| `vehicles_with_status` | Vehicles with online/offline status |
| `latest_vehicle_events` | Most recent alert per vehicle |

### Functions

| Function | Description |
|----------|-------------|
| `get_user_fleet_id()` | Returns current user's fleet_id |
| `is_superadmin()` | Checks if user is superadmin |

## Seed Data

To load demo data (development only):

```bash
supabase db reset --seed
```

Or manually:

```bash
psql -h db.qhsquyccwnmyxpgfigru.supabase.co -U postgres -d postgres -f seeds/demo_data.sql
```

## Environment Variables

Required environment variables:

```bash
SUPABASE_URL=https://qhsquyccwnmyxpgfigru.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

## Troubleshooting

### Migration conflicts

If migrations are out of sync:

```bash
supabase migration repair --status applied <version>
```

### View current schema

```bash
supabase db dump --schema public
```

### Check for issues

```bash
supabase db lint
```
