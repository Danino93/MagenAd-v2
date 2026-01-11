# 🔌 MagenAd API Documentation

## Base URL

```
Production: https://api.magenad.com
Development: http://localhost:3001
```

---

## Authentication

All API requests require authentication using JWT tokens.

### Get Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### Using Token

Include in Authorization header:

```http
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## Endpoints

### Dashboard

#### Get Stats

```http
GET /api/dashboard/stats
Authorization: Bearer TOKEN
```

**Response:**

```json
{
  "total_campaigns": 5,
  "total_anomalies": 23,
  "high_severity": 8,
  "total_clicks": 15420,
  "total_cost": 3245.50,
  "quiet_index": 7.5
}
```

---

### Anomalies

#### List Anomalies

```http
GET /api/anomalies?page=1&limit=20&severity=high
Authorization: Bearer TOKEN
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 20) |
| severity | string | Filter by severity (high/medium/low) |
| status | string | Filter by status (new/investigating/resolved) |
| dateFrom | date | Start date (ISO format) |
| dateTo | date | End date (ISO format) |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "rule_name": "IP Anomaly Detection",
      "severity": "high",
      "confidence": 0.95,
      "description": "Multiple clicks from same IP",
      "detected_at": "2026-01-11T10:30:00Z",
      "status": "new"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### Get Anomaly Details

```http
GET /api/anomalies/:id
Authorization: Bearer TOKEN
```

#### Update Anomaly Status

```http
PATCH /api/anomalies/:id
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "status": "resolved",
  "notes": "False positive - internal testing"
}
```

#### Bulk Operations

```http
POST /api/anomalies/bulk
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "ids": ["uuid1", "uuid2", "uuid3"],
  "action": "resolve"
}
```

---

### Reports

#### Generate Report

```http
POST /api/reports/generate
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "type": "summary",
  "dateRange": "7days",
  "format": "pdf"
}
```

**Response:** Binary PDF file

---

### Campaigns

#### List Campaigns

```http
GET /api/campaigns
Authorization: Bearer TOKEN
```

#### Get Campaign Details

```http
GET /api/campaigns/:id
Authorization: Bearer TOKEN
```

---

## Rate Limits

- **General API:** 100 requests per 15 minutes per IP
- **Authentication:** 5 requests per 15 minutes per IP
- **Reports:** 3 requests per minute

**Rate Limit Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

**Error Response Format:**

```json
{
  "error": {
    "message": "Invalid request parameters",
    "code": "INVALID_PARAMS"
  }
}
```

---

## Webhooks (Coming Soon)

Subscribe to events:
- `anomaly.detected` - New anomaly detected
- `report.generated` - Report ready
- `campaign.updated` - Campaign changed

---

**Version:** 2.0  
**Last Updated:** January 2026
