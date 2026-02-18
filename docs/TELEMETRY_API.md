# Entry Telemetry Ingest API

Professional endpoint for receiving vehicle telemetry data from GPS devices and OBD-II readers.

## Base URL

```
https://qhsquyccwnmyxpgfigru.supabase.co/functions/v1/telemetry-ingest
```

---

## Authentication

All requests require an API key. Provide it via:

| Method | Example |
|--------|---------|
| Header (recommended) | `X-API-Key: your-api-key` |
| Query parameter | `?api_key=your-api-key` |

---

## Endpoints

### POST `/telemetry-ingest`

Submit telemetry events (single or batch).

#### Request Headers

```
Content-Type: application/json
X-API-Key: your-api-key
```

#### Request Body

**Single Event:**
```json
{
  "imei": "123456789012345",
  "event_type": "location_update",
  "latitude": 18.0179,
  "longitude": -76.8099,
  "speed": 45.5,
  "heading": 180,
  "event_data": {
    "accuracy": 5
  }
}
```

**Batch Events (max 100):**
```json
[
  {
    "imei": "123456789012345",
    "event_type": "location_update",
    "latitude": 18.0179,
    "longitude": -76.8099,
    "speed": 45.5
  },
  {
    "imei": "123456789012345",
    "event_type": "harsh_braking",
    "latitude": 18.0180,
    "longitude": -76.8100,
    "speed": 30.0,
    "severity": "warning",
    "event_data": {
      "deceleration_g": 0.65
    }
  }
]
```

---

## Event Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `imei` | string | Yes* | Device IMEI (15 digits). Use this OR `vehicle_id` |
| `vehicle_id` | uuid | Yes* | Vehicle UUID. Use this OR `imei` |
| `device_id` | uuid | No | Device UUID (auto-resolved if not provided) |
| `event_type` | string | **Yes** | Type of event (see table below) |
| `event_subtype` | string | No | Sub-classification (e.g., DTC code, power event type) |
| `severity` | string | No | `info`, `warning`, or `critical` (auto-assigned if omitted) |
| `latitude` | number | **Yes** | GPS latitude (-90 to 90) |
| `longitude` | number | **Yes** | GPS longitude (-180 to 180) |
| `speed` | number | No | Speed in km/h |
| `heading` | number | No | Direction in degrees (0-360) |
| `event_data` | object | No | Additional event-specific data |
| `raw_payload` | object | No | Original device payload (for debugging) |
| `event_at` | string | No | ISO 8601 timestamp (defaults to now) |

*Either `imei` or `vehicle_id` is required.

---

## Event Types

| Event Type | Default Severity | Description |
|------------|-----------------|-------------|
| `location_update` | info | GPS position update |
| `overspeed` | warning | Speed limit exceeded |
| `harsh_braking` | warning | Sudden deceleration detected |
| `harsh_acceleration` | warning | Sudden acceleration detected |
| `harsh_cornering` | warning | Sharp turn detected |
| `collision_detected` | critical | Impact/crash detected |
| `dtc_detected` | warning | OBD-II diagnostic trouble code |
| `device_online` | info | Device connected |
| `device_offline` | warning | Device disconnected |
| `power_event` | warning | Power-related event (low battery, unplug) |
| `pid_reading` | info | OBD-II parameter reading |

---

## Event Data Examples

### Location Update
```json
{
  "event_type": "location_update",
  "event_data": {
    "heading": 180,
    "accuracy": 5,
    "altitude": 150
  }
}
```

### Overspeed
```json
{
  "event_type": "overspeed",
  "event_data": {
    "speed_limit": 60,
    "recorded_speed": 85
  }
}
```

### Harsh Braking
```json
{
  "event_type": "harsh_braking",
  "event_data": {
    "deceleration_g": 0.7
  }
}
```

### Harsh Acceleration
```json
{
  "event_type": "harsh_acceleration",
  "event_data": {
    "acceleration_g": 0.55
  }
}
```

### Harsh Cornering
```json
{
  "event_type": "harsh_cornering",
  "event_data": {
    "lateral_g": 0.5
  }
}
```

### Collision Detected
```json
{
  "event_type": "collision_detected",
  "severity": "critical",
  "event_data": {
    "impact_g": 2.5,
    "impact_direction": "front"
  }
}
```

### DTC Detected
```json
{
  "event_type": "dtc_detected",
  "event_subtype": "P0300",
  "event_data": {
    "dtc_description": "Random/Multiple Cylinder Misfire Detected"
  }
}
```

### PID Reading
```json
{
  "event_type": "pid_reading",
  "event_subtype": "battery_voltage",
  "event_data": {
    "value": 14.2,
    "unit": "V",
    "description": "Battery Voltage"
  }
}
```

### Power Event
```json
{
  "event_type": "power_event",
  "event_subtype": "low_battery",
  "event_data": {
    "battery_voltage": 11.5,
    "event_description": "Low battery voltage detected"
  }
}
```

---

## Response Format

### Success (201 Created)
```json
{
  "success": true,
  "message": "Successfully processed 1 event.",
  "data": {
    "processed": 1,
    "failed": 0,
    "events": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "vehicle_id": "...",
        "device_id": "...",
        "event_type": "location_update",
        "latitude": 18.0179,
        "longitude": -76.8099
      }
    ]
  }
}
```

### Partial Success (207 Multi-Status)
```json
{
  "success": true,
  "message": "Processed 8/10 events. 2 failed.",
  "data": {
    "processed": 8,
    "failed": 2,
    "events": [...],
    "errors": [
      { "index": 3, "error": "Device with IMEI '999999999999999' not found" },
      { "index": 7, "error": "Device with IMEI '888888888888888' not found" }
    ]
  }
}
```

### Validation Error (400 Bad Request)
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    "Event[0]: 'latitude' is required",
    "Event[1]: Invalid event_type 'invalid'. Valid types: location_update, overspeed, ..."
  ]
}
```

### Authentication Error (401/403)
```json
{
  "success": false,
  "message": "Authentication required. Provide API key via X-API-Key header or api_key query parameter."
}
```

---

## Code Examples

### cURL

```bash
# Single event
curl -X POST "https://qhsquyccwnmyxpgfigru.supabase.co/functions/v1/telemetry-ingest" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "imei": "123456789012345",
    "event_type": "location_update",
    "latitude": 18.0179,
    "longitude": -76.8099,
    "speed": 45.5
  }'
```

### Python

```python
import requests

API_URL = "https://qhsquyccwnmyxpgfigru.supabase.co/functions/v1/telemetry-ingest"
API_KEY = "YOUR_API_KEY"

# Single event
event = {
    "imei": "123456789012345",
    "event_type": "location_update",
    "latitude": 18.0179,
    "longitude": -76.8099,
    "speed": 45.5,
    "heading": 180,
    "event_data": {
        "accuracy": 5
    }
}

response = requests.post(
    API_URL,
    json=event,
    headers={
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
    }
)

print(response.json())
```

### JavaScript/Node.js

```javascript
const API_URL = "https://qhsquyccwnmyxpgfigru.supabase.co/functions/v1/telemetry-ingest";
const API_KEY = "YOUR_API_KEY";

// Batch events
const events = [
  {
    imei: "123456789012345",
    event_type: "location_update",
    latitude: 18.0179,
    longitude: -76.8099,
    speed: 45.5
  },
  {
    imei: "123456789012345",
    event_type: "harsh_braking",
    latitude: 18.0180,
    longitude: -76.8100,
    speed: 30.0,
    event_data: { deceleration_g: 0.65 }
  }
];

const response = await fetch(API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY
  },
  body: JSON.stringify(events)
});

const result = await response.json();
console.log(result);
```

### PHP

```php
<?php
$api_url = "https://qhsquyccwnmyxpgfigru.supabase.co/functions/v1/telemetry-ingest";
$api_key = "YOUR_API_KEY";

$event = [
    "imei" => "123456789012345",
    "event_type" => "location_update",
    "latitude" => 18.0179,
    "longitude" => -76.8099,
    "speed" => 45.5
];

$ch = curl_init($api_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($event));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "X-API-Key: " . $api_key
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));
?>
```

---

## Rate Limits

| Plan | Requests/second | Batch size |
|------|-----------------|------------|
| Free | 10 req/s | 100 events |
| Pro | 100 req/s | 100 events |

---

## Error Codes

| HTTP Status | Meaning |
|-------------|---------|
| 201 | Success - All events processed |
| 207 | Partial success - Some events failed |
| 400 | Bad request - Validation errors |
| 401 | Unauthorized - Missing API key |
| 403 | Forbidden - Invalid API key |
| 405 | Method not allowed - Use POST |
| 500 | Server error |

---

## Best Practices

1. **Use IMEI for device identification** - The API will automatically resolve the vehicle and device IDs
2. **Batch events when possible** - Reduces API calls and improves throughput
3. **Include event_at timestamp** - Ensures accurate event ordering
4. **Store raw_payload for debugging** - Helps troubleshoot device issues
5. **Handle partial failures** - Check the response for failed events in batch requests

---

## Support

For questions or issues, contact the Entry development team.
