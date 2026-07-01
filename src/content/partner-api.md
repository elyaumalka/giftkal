# Giftkal – Partner API Documentation

**Version:** 1.0
**Last updated:** July 2026
**Base URL:** `https://xadihaigjkbvphzphxxk.supabase.co/functions/v1/public-api`
**Support:** support@giftkal.com

---

## 1. Overview

The Giftkal Partner API lets your system:

1. Create end-users (event owners, venue owners) inside Giftkal.
2. Create and manage events, guests, RSVPs, transactions, venues, halls and devices on their behalf.
3. Receive real-time **webhook notifications** when payments settle, sellers get approved, and payouts complete.

A **partner** is a scoped identity inside Giftkal. Every API key issued to you is tagged with your partner ID, which means:

- Every list/read call is automatically filtered — **you can only see the events, users and data that your key created.**
- Every create call is auto-tagged with your partner ID.
- You cannot read or modify data that belongs to another partner or to direct Giftkal customers.

---

## 2. Authentication

Every request must include your API key in the header:

```
x-api-key: <YOUR_API_KEY>
Content-Type: application/json
```

Requests without a valid, active key return `401 Unauthorized`.

> 🔐 **Keep the API key server-side only.** Never embed it in a browser, mobile app, or public repo. If leaked, contact Giftkal to rotate immediately.

---

## 3. Request format

All endpoints go through a single URL. The **action** is passed as a query parameter, and the payload as a JSON body:

```
POST https://xadihaigjkbvphzphxxk.supabase.co/functions/v1/public-api?action=CreateEvent
x-api-key: sk_live_xxxxxxxxxxxxxxxx
Content-Type: application/json

{
  "owner_id": "6f1b...",
  "event_date": "2026-11-05",
  "event_type": "חתונה",
  "groom_name": "דוד",
  "bride_name": "שרה"
}
```

Read-only actions accept `GET` with query params instead of a JSON body (both work).

### Response envelope

Success:
```json
{ "responseStatus": "OK", "event": { ... } }
```

Error:
```json
{ "responseStatus": "ERROR", "error": "event_id is required", "code": 400 }
```

HTTP status codes: `200` OK, `400` bad request, `401` unauthorized, `403` forbidden (cross-partner access), `404` not found, `500` server error.

---

## 4. Actions reference

### 4.1 Users & profiles

| Action | Method | Description |
|---|---|---|
| `CreateEventOwner` | POST | Create an event owner user + optionally an initial event. |
| `CreateVenueOwner` | POST | Create a venue owner user + optionally an initial venue. |
| `ListProfiles` | GET | List all profiles created by your partner key. |
| `GetProfile` | GET | Get a single profile by `user_id`. |
| `UpdateProfile` | POST | Update `full_name`, `phone`, `avatar_url`. |

**Example — CreateEventOwner:**
```json
POST ?action=CreateEventOwner
{
  "email": "chatan@example.com",
  "password": "SecurePass123!",
  "full_name": "דוד כהן",
  "phone": "+972501234567",
  "event": {
    "event_type": "חתונה",
    "event_date": "2026-11-05",
    "groom_name": "דוד",
    "bride_name": "שרה"
  }
}
```
Returns `{ user: { id, email, full_name }, event: { ... } }`.

### 4.2 Events

| Action | Method | Description |
|---|---|---|
| `CreateEvent` | POST | Create an event for an existing owner. Requires `owner_id`, `event_date`. |
| `GetEvent` | GET | Get event by `event_id`. |
| `ListEvents` | GET | List all your events. Optional `venue_id`, `owner_id` filters. |
| `UpdateEvent` | POST | Update any event field. Requires `event_id`. |
| `GetEventStats` | GET | Guests & transactions summary for an event. |

### 4.3 Guests & RSVP

| Action | Method | Description |
|---|---|---|
| `ListGuests` | GET | List guests for `event_id`. Optional `status` filter (`approved`/`declined`/`pending`). Returns stats. |
| `AddGuest` | POST | Add a single guest. |
| `BulkAddGuests` | POST | Bulk insert. Body: `{ event_id, guests: [{ full_name, phone, ... }] }`. |
| `UpdateGuest` | POST | Edit any guest field. Requires `guest_id`. |
| `UpdateRSVP` | POST | Set `rsvp_status` (`approved`/`declined`/`pending`) and `number_of_guests`. |
| `BulkUpdateRSVP` | POST | Body: `{ updates: [{ guest_id, rsvp_status, number_of_guests }] }`. |
| `DeleteGuest` | DELETE/GET | Delete by `guest_id`. |

### 4.4 Transactions

| Action | Method | Description |
|---|---|---|
| `GetTransactions` | GET | List transactions for `event_id` with total amount. |
| `GetTransaction` | GET | Get one by `transaction_id`. |
| `CreateTransaction` | POST | Manually record a transaction (rarely needed — most transactions come from Giftkal's own gift flow). |

### 4.5 Venues, Halls, Devices

| Action | Method | Description |
|---|---|---|
| `CreateVenue` / `GetVenue` / `ListVenues` / `UpdateVenue` / `DeleteVenue` | mixed | Venue CRUD. |
| `CreateDevice` / `ListDevices` / `UpdateDevice` / `DeleteDevice` | mixed | Kiosk device CRUD (needs `venue_id`, `serial_number`). |
| `IdentifyDevice` | GET | Kiosk boot lookup — pass `serial_number` or `hall_id`, returns today's active event + gift URL. |

### 4.6 Leads & landing page leads

| Action | Method | Description |
|---|---|---|
| `ListLeads` / `GetLead` / `CreateLead` / `UpdateLead` / `DeleteLead` | mixed | CRM leads. |
| `ListLandingLeads` / `CreateLandingLead` / `UpdateLandingLead` / `DeleteLandingLead` | mixed | Leads captured from venue landing pages. |

### 4.7 Support, invoices, documents, notes, tasks

Standard CRUD actions — see full list in section 8.

### 4.8 System stats

| Action | Method | Description |
|---|---|---|
| `GetSystemStats` | GET | High-level counts (events, venues, users, leads, total transaction amount). |

---

## 5. Webhooks

If you provided a `webhook_url` when your partner was created, Giftkal will POST notifications there when things happen to **your** events.

### 5.1 Event types

| `event_type` | When it fires |
|---|---|
| `seller-approve` | PayMe finished approving the merchant for a specific event — the event can now accept payments. |
| `sale-paid` | A gift payment succeeded. |
| `sale-failure` | A gift payment failed. |
| `refund` | A gift was refunded. |
| `withdrawal-complete` | A payout to the event owner's bank account completed. |

Subscribe by giving Giftkal the list of `event_type` values you want. Omitting the list means "all events".

### 5.2 Delivery format

```
POST <your webhook_url>
Content-Type: application/json
X-Giftkal-Event: sale-paid
X-Giftkal-Signature: <hex HMAC-SHA256>

{
  "event_type": "sale-paid",
  "delivered_at": "2026-07-01T12:34:56.789Z",
  "data": {
    "transaction_id": "b3d5...",
    "event_id": "a12b...",
    "payment_status": "completed",
    "amount": 350,
    "gift_amount": 347.70,
    "fee_amount": 2.30,
    "payer_name": "אבי לוי"
  }
}
```

Payload shape for other event types:

- **`seller-approve`** — `{ event_id, seller_payme_id, status: "approved" }`
- **`withdrawal-complete`** — includes `seller_payme_id`, `payme_payout_code`, `amount`

### 5.3 Signature verification (required)

Every delivery is signed with **HMAC-SHA256** over the raw request body, using the secret you received once when the partner was created.

**Node.js example:**
```js
import crypto from "crypto";

app.post("/webhooks/giftkal", express.raw({ type: "application/json" }), (req, res) => {
  const secret = process.env.GIFTKAL_WEBHOOK_SECRET;
  const signature = req.header("X-Giftkal-Signature");
  const expected = crypto.createHmac("sha256", secret).update(req.body).digest("hex");

  if (signature !== expected) return res.status(401).send("bad signature");

  const payload = JSON.parse(req.body.toString());
  // handle payload.event_type, payload.data ...
  res.status(200).send("ok");
});
```

**PHP example:**
```php
$secret = getenv('GIFTKAL_WEBHOOK_SECRET');
$body = file_get_contents('php://input');
$expected = hash_hmac('sha256', $body, $secret);
if (!hash_equals($expected, $_SERVER['HTTP_X_GIFTKAL_SIGNATURE'] ?? '')) {
    http_response_code(401); exit;
}
```

### 5.4 Retries and delivery log

- Return **HTTP 2xx** within 10 seconds to acknowledge. Any non-2xx or timeout is logged as a failure.
- Currently there is **no automatic retry**. Giftkal stores every delivery attempt (status + response body) and the admin can replay failed deliveries on request.
- Deduplicate on `transaction_id` (or `event_id + delivered_at`) — treat webhooks as at-least-once.

---

## 6. Test environment

Giftkal runs a **single production environment** — there is no separate sandbox. To test safely:

1. Ask Giftkal to issue a **dedicated "test" partner + API key** so your test data stays isolated from real customers.
2. Point your `webhook_url` at [https://webhook.site](https://webhook.site) or a local ngrok tunnel to inspect payloads live.
3. For end-to-end gift-flow tests without real charges, Giftkal can provide a **bypass coupon** (`GIFTKAL-TEST`) that completes transactions without hitting PayMe — you'll still get the full webhook.
4. When done, delete the test partner — this removes all its API keys as well.

---

## 7. Best practices

- **Idempotency:** when creating an event owner, catch `email already registered` errors and treat them as "already exists" — don't retry blindly.
- **Never store user passwords** you send to `CreateEventOwner`. Send a random 16+ char password and rely on Giftkal's password-reset flow for user access.
- **Server-side only** — the API key is not CORS-restricted, but you must not expose it to browsers.
- **Timestamps** are ISO 8601 UTC. Dates (`event_date`) are `YYYY-MM-DD`.
- **Hebrew text** — send UTF-8; Giftkal stores names in Hebrew natively.

---

## 8. Full action list

**Events:** `GetEvent`, `ListEvents`, `UpdateEvent`, `CreateEvent`
**Guests:** `ListGuests`, `AddGuest`, `UpdateGuest`, `UpdateRSVP`, `DeleteGuest`, `BulkAddGuests`, `BulkUpdateRSVP`
**Transactions:** `GetTransactions`, `GetTransaction`, `CreateTransaction`
**Venues:** `GetVenue`, `ListVenues`, `UpdateVenue`, `CreateVenue`, `DeleteVenue`
**Leads:** `ListLeads`, `GetLead`, `CreateLead`, `UpdateLead`, `DeleteLead`
**Users:** `ListProfiles`, `GetProfile`, `CreateEventOwner`, `CreateVenueOwner`, `ListUsers`, `UpdateProfile`
**Documents:** `ListDocuments`, `AddDocument`, `DeleteDocument`
**Stats:** `GetEventStats`, `GetSystemStats`
**Support:** `ListTickets`, `CreateTicket`, `UpdateTicket`
**Invoices:** `ListInvoices`, `GetInvoice`, `CreateInvoice`, `UpdateInvoice`
**Devices:** `ListDevices`, `CreateDevice`, `UpdateDevice`, `DeleteDevice`, `IdentifyDevice`
**Notes:** `ListNotes`, `CreateNote`, `UpdateNote`, `DeleteNote`
**Tasks:** `ListTasks`, `CreateTask`, `UpdateTask`, `DeleteTask`
**Landing leads:** `ListLandingLeads`, `CreateLandingLead`, `UpdateLandingLead`, `DeleteLandingLead`
**Settings:** `GetSystemSettings`, `UpdateSystemSettings`, `GetRequiredDocuments`

---

## 9. Onboarding checklist

Before going live, Giftkal will provide:

- [ ] Partner name registered in the system
- [ ] `x-api-key` value (shown once — store securely)
- [ ] `webhook_secret` value (shown once — store securely)
- [ ] Confirmed `webhook_url` reachable from the internet
- [ ] Confirmed subscription to relevant `webhook_events`

You should be able to:

- [ ] `CreateEventOwner` and see the profile in `ListProfiles`
- [ ] `CreateEvent` for that owner and see it in `ListEvents`
- [ ] Receive at least one test webhook and validate the signature

---

*© Giftkal · giftkal.com*
