# Template Verification System

## Overview

The Template Verification System is a pre-send validation framework that ensures messages meet transport-specific requirements before being queued for delivery. This system prevents wasted resources, provides immediate feedback, and improves the overall reliability of message delivery.

### Why It Exists

Different communication channels have different requirements:

- **WhatsApp** requires pre-approved message templates
- **SMS** requires verified sender IDs for certain regions
- **Email** requires verified domain ownership
- **Voice** requires registered caller IDs

Without verification, messages are accepted, queued, processed, and only fail when reaching the external API—wasting time, resources, and creating confusion.

### What It Does

The system validates messages **before** they enter the queue, providing:

- **Immediate feedback** when something is wrong
- **Clear error messages** explaining what's missing
- **Template discovery** so users know what's available
- **Proactive monitoring** of template status changes
- **Reduced API costs** by preventing doomed-to-fail requests

---

## Core Concepts

### 1. Capabilities

Each transport declares what verification it needs:

```
Transport: WhatsApp Business
├─ Capability: TEMPLATE_VERIFICATION
├─ Capability: MEDIA_SUPPORT
└─ Validation: Check templates before sending

Transport: Twilio SMS
├─ Capability: SENDER_ID_VERIFICATION
└─ Validation: Check sender ID is verified

Transport: Basic Email
└─ (No special capabilities, sends immediately)
```

**Key Point**: Capabilities are optional. Transports without capabilities work exactly as before.

### 2. Templates

Templates are pre-approved message formats stored in the system:

```
Template: order_confirmation
├─ Status: APPROVED
├─ Transport: WhatsApp Business
├─ Content: "Hi {{name}}, your order {{id}} is ready!"
├─ Parameters: 2 (name, order_id)
├─ Language: English
└─ Last Synced: 2 hours ago
```

### 3. Validation Flow

```
Message Request
    ↓
Does transport have capabilities?
    ├─ No → Skip validation, send normally
    └─ Yes → Run capability checks
              ↓
         All checks pass?
              ├─ Yes → Continue to queue
              └─ No → Return error immediately
```

---

## How It Works: Complete Walkthrough

### Stage 1: Initial Setup (SDK-Driven, One-Time)

All template and transport setup is handled **entirely through RS Connect SDK**.  
RS Connect acts as the **single control plane**, while provider-specific APIs (Meta, Twilio, Viber, etc.) are called internally.

---

#### 1 Admin Creates Templates via RS Connect SDK

**Where**: RS Connect Template SDK  
**Who**: Admin  
**How**: Connect template sdk calls from different clients

---

#### What Happens

1. Admin calls RS Connect to create a template
2. RS Connect:
   - Identifies the selected transport
   - Resolves the provider (Meta, Twilio, etc.)
   - Transforms the template into provider-specific format
3. RS Connect sends the template creation request to the provider API
4. Provider validates and registers the template
5. Provider returns a template ID and initial status (`PENDING_APPROVAL`)
6. RS Connect stores the template locally

---

#### Example: WhatsApp Template Creation

**API Call**
```http
POST /api/templates

{
  "transportId": "cuid_whatsapp_main",
  "name": "order_confirmation",
  "category": "UTILITY",
  "language": "en",
  "content": "Hi {{1}}, your order {{2}} is ready for pickup!",
  "parameters": ["text", "text"]
}
```
#### Internal Processing in RS Connect

- Transport type: API
- Provider resolved: WhatsApp
- Capability detected: TEMPLATE_VERIFICATION
- Template is submitted for provider approval

#### Stored Template Record (RS Connect)
```
{
  "name": "order_confirmation",
  "externalId": "whatsapp_tpl_12345",
  "status": "PENDING",
  "isActive": false
}
```
#### Outcome

- Template is created in provider system
- Approval process initiated
- RS Connect tracks template lifecycle

### Stage 2: Sending Messages (Every Time)

#### User Submits Broadcast Request

**Where**: Your application calls RS Connect API

**What Happens**:

1. Your app sends a POST request to create a broadcast
2. Request includes:
   - Transport ID (which WhatsApp transport to use)
   - Message content and template name
   - List of recipient phone numbers
   - Any parameters for the template

**Example Request**:

```
POST /broadcasts
{
  "transport": "whatsapp-transport-abc123",
  "message": {
    "content": "order_confirmation",
    "meta": {
      "templateName": "order_confirmation",
      "languageCode": "en",
      "components": [
        {"type": "body", "parameters": [
          {"type": "text", "text": "John Doe"},
          {"type": "text", "text": "ORD-789"}
        ]}
      ]
    }
  },
  "addresses": ["+1234567890"],
  "trigger": "IMMEDIATE"
}
```

**Outcome**: Request received by RS Connect

---

#### RS Connect Validates Request

**What Happens** (step by step):

1. **Look up the transport**

   - Query: "What is transport abc123?"
   - Found: WhatsApp Main Channel
   - Capabilities: [TEMPLATE_VERIFICATION, MEDIA_SUPPORT]

2. **Check if validation needed**

   - Question: "Does this transport require validation?"
   - Answer: Yes, it has TEMPLATE_VERIFICATION capability

3. **Look up the template**

   - Query: "Do I have template 'order_confirmation' for this transport?"
   - Search database templates table
   - Result: Found template record

4. **Check template status**

   - Template status: APPROVED ✓
   - Template active: Yes ✓
   - For correct transport: Yes ✓

5. **Validate parameters**

   - Template expects: 2 parameters
   - Message provides: 2 parameters ["John Doe", "ORD-789"]
   - Parameter types: Both text ✓
   - Match: Yes ✓

6. **All validations pass**
   - Template exists: ✓
   - Template approved: ✓
   - Parameters correct: ✓
   - Ready to proceed: ✓

**Outcome**: Validation successful, proceed to next step

---

#### RS Connect Creates Session and Broadcasts

**What Happens**:

1. Create a Session record in database
2. Create individual Broadcast records for each recipient
3. Mark session status as "PENDING"
4. Prepare to add to queue

**Database Records Created**:

```
Session:
  ID: session-xyz789
  Transport: whatsapp-transport-abc123
  Status: PENDING
  Total Addresses: 1
  Message: {template data}

Broadcast:
  ID: broadcast-001
  Session: session-xyz789
  Address: +1234567890
  Status: SCHEDULED
  Attempts: 0
```

**Outcome**: Records created, ready for queueing

---

#### RS Connect Queues for Processing

**What Happens**:

1. Check transport readiness (worker is running)
2. Add message to RabbitMQ queue
3. Worker picks up message
4. Worker sends to WhatsApp API
5. WhatsApp delivers message
6. Worker logs result

**Flow**:

```
RabbitMQ Queue → WhatsApp Worker → Meta API → Recipient
                       ↓
                 Update database with result
```

**Outcome**: Message sent successfully

---

#### User Receives Response

**What User Sees** (immediately):

```json
{
  "success": true,
  "data": {
    "cuid": "session-xyz789",
    "status": "PENDING",
    "totalAddresses": 1,
    "transport": "whatsapp-transport-abc123",
    "triggerType": "IMMEDIATE",
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

**Later** (can check status):

```
GET /sessions/session-xyz789/broadcasts

Response:
{
  "data": [
    {
      "address": "+1234567890",
      "status": "SUCCESS",
      "attempts": 1,
      "lastAttempt": "2026-01-15T10:30:05Z"
    }
  ]
}
```

**Outcome**: User has session ID to track delivery

---

### Stage 3: When Validation Fails

#### Scenario: Template Not Found

**User Submits**:

```
Template: "new_promo_2026"
(This template doesn't exist in RS Connect)
```

**What RS Connect Does**:

1. Look up transport → Has TEMPLATE_VERIFICATION
2. Search for template "new_promo_2026" → NOT FOUND
3. **Stop immediately** (don't create session, don't queue)
4. Return error response

**User Receives** (immediately):

```json
{
  "error": "ValidationError",
  "message": "Template 'new_promo_2026' not found or not approved",
  "code": "TEMPLATE_NOT_APPROVED",
  "field": "message.meta.templateName",
  "help": {
    "action": "Create template in Meta Business Manager and sync to RS Connect",
    "available_templates": ["order_confirmation", "welcome_message", "appointment_reminder"]
  }
}
```

**What This Prevents**:

- ❌ No database records created
- ❌ No queue processing wasted
- ❌ No API call to WhatsApp
- ❌ No "failed" broadcast logs
- ✓ Immediate, clear feedback
- ✓ User knows exactly what to do

**Outcome**: Fast failure with actionable error

---

#### Scenario: Wrong Number of Parameters

**User Submits**:

```
Template: "order_confirmation" (expects 2 parameters)
Provides: 1 parameter ["John Doe"] (missing order ID)
```

**What RS Connect Does**:

1. Template found: ✓
2. Check parameters:
   - Expected: 2
   - Provided: 1
   - Mismatch: ❌
3. Stop and return error

**User Receives**:

```json
{
  "error": "ValidationError",
  "message": "Template 'order_confirmation' requires 2 parameters but received 1",
  "code": "PARAMETER_COUNT_MISMATCH",
  "details": {
    "template": "order_confirmation",
    "expected_parameters": 2,
    "received_parameters": 1,
    "parameter_names": ["customer_name", "order_id"]
  }
}
```

**Outcome**: User immediately knows what's wrong and can fix it

---

#### Scenario: Template Was Disabled by Provider

**Background**:

- Template "holiday_sale" was approved last month
- Meta disabled it yesterday (policy violation)
- RS Connect hasn't synced yet

**User Submits**:

```
Template: "holiday_sale"
```

**What RS Connect Does** (depends on configuration):

**Option A: Template Still Shows as Approved (Stale Data)**

1. Template found in database: ✓
2. Status in database: APPROVED ✓
3. Validation passes: ✓
4. Message queued and sent to WhatsApp
5. WhatsApp API returns error: "Template disabled"
6. Worker logs failure
7. System updates template status to DISABLED

**User Receives**:

```json
{
  "success": true,
  "sessionId": "xyz"
}

(Later checking status shows FAILED with Meta error)
```

**Option B: With Real-Time Verification (Optional)**

1. Template found: ✓
2. Last sync: 7 days ago (stale)
3. System calls Meta API to verify current status
4. Meta says: DISABLED
5. System updates database immediately
6. Validation fails
7. Return error

**User Receives**:

```json
{
  "error": "ValidationError",
  "message": "Template 'holiday_sale' has been disabled by the provider",
  "code": "TEMPLATE_DISABLED",
  "details": {
    "disabled_at": "2026-01-14",
    "reason": "Policy violation"
  }
}
```

**Outcome**: Depends on configuration—immediate detection with real-time check, or fast detection on first failure

---

### Stage 4: Template Maintenance (Ongoing)

#### Manual Template Sync

**When**: Admin notices new templates aren't available, or suspects templates are out of sync

**What Happens**:

1. Admin clicks "Sync Templates" button
2. System shows: "Syncing..."
3. System calls provider API (e.g., Meta)
4. Receives list of all templates with current statuses
5. Compares with database:
   - New templates → Add to database
   - Changed status → Update in database
   - Deleted templates → Mark as inactive
6. Shows sync summary

**Example Output**:

```
Sync Completed at 2026-01-15 10:45:00

Changes Detected:
✓ 3 new templates added
  - birthday_greeting (APPROVED)
  - payment_reminder (APPROVED)
  - feedback_request (PENDING)

✓ 2 templates status changed
  - holiday_sale: APPROVED → DISABLED
  - summer_promo: PENDING → APPROVED

✓ 1 template removed
  - old_announcement (no longer exists in provider)

Total Active Templates: 15
Total Pending: 3
Total Inactive: 4
```

**Outcome**: Database is now synchronized with provider

---

#### Automatic Template Sync

**When**: Runs on a schedule (e.g., every 24 hours at 2 AM)

**What Happens**:

1. Scheduled job wakes up
2. Gets list of all transports with TEMPLATE_VERIFICATION capability
3. For each transport:
   - Calls provider API
   - Syncs templates
   - Logs any changes
4. If critical changes detected (popular template disabled):
   - Sends alert email to admin
   - Logs warning
   - Updates admin dashboard

**Example Alert Email**:

```
Subject: [RS Connect] Template Status Change Alert

Important: A frequently-used template has been disabled

Template: order_confirmation
Transport: WhatsApp Main Channel
Previous Status: APPROVED
New Status: DISABLED
Change Detected: 2026-01-15 02:00:00

Impact:
- This template was used 1,234 times in the last 7 days
- New broadcast requests using this template will fail

Action Required:
1. Check provider dashboard for reason
2. Create new template or fix policy violation
3. Update applications using this template

View Details: https://rsconnect.example.com/templates/order_confirmation
```

**Outcome**: Proactive detection of issues before users notice

---

## User Workflows

### Workflow 1: Developer Sending First Message

**Goal**: Send a WhatsApp message from their application

**Steps**:

1. **Discover Available Templates**

   - Call: `GET /templates?transport={transportId}&status=APPROVED`
   - See list of templates they can use
   - Choose: "order_confirmation"

2. **Check Template Requirements**

   - Call: `GET /templates/{templateId}`
   - See: Needs 2 parameters (customer_name, order_id)
   - See: Example usage

3. **Prepare Message**

   - Build request with template name
   - Include required parameters
   - Format according to documentation

4. **Send Message**

   - Call: `POST /broadcasts` with prepared data
   - Receive immediate response (success or validation error)
   - Get session ID to track status

5. **Monitor Delivery**
   - Call: `GET /sessions/{sessionId}/broadcasts`
   - See delivery status for each recipient
   - Confirm message was delivered

**Outcome**: Message sent successfully on first try

---

### Workflow 2: Developer Creates New Template

**Goal**: Use a new message template that doesn't exist yet

**Steps**:

1. **Attempt to Send**

   - Try sending with new template name
   - Receive error: "Template not found"

2. **Create Template in Provider**

   - Go to Meta Business Manager
   - Create template with desired content
   - Submit for approval
   - Wait for approval (24-48 hours)

3. **Verify Approval**

   - Check Meta dashboard
   - Confirm status is "APPROVED"

4. **Sync to RS Connect**

   - Option A: Ask admin to sync templates
   - Option B: Wait for automatic sync (next scheduled run)
   - Option C: Use sync API if authorized

5. **Verify in RS Connect**

   - Call: `GET /templates?search={templateName}`
   - Confirm template now shows as APPROVED

6. **Send Message**
   - Retry original request
   - Now succeeds

**Outcome**: New template available for use

---

### Workflow 3: Admin Manages Templates

**Goal**: Keep templates synchronized and healthy

**Daily Tasks**:

1. **Check Dashboard**

   - View template summary
   - See: X active, Y pending, Z disabled
   - Check: Any alerts or warnings?

2. **Review Recent Changes**

   - See: Auto-sync ran last night
   - See: 1 template was disabled
   - Action: Investigate why

3. **Handle Issues**
   - Disabled template: Check provider reason
   - Pending template: Check approval status
   - Failed messages: Check if template-related

**Weekly Tasks**:

1. **Manual Sync**

   - Click "Sync All Transports"
   - Review sync report
   - Address any discrepancies

2. **Usage Review**

   - See: Most-used templates
   - See: Templates never used (consider removing)
   - See: High failure rate (investigate)

3. **Template Cleanup**
   - Disable old templates no longer needed
   - Remove templates that were rejected
   - Archive historical templates

**Outcome**: Templates stay healthy and synchronized

---

### Workflow 4: Support Team Troubleshoots Failed Message

**Goal**: Understand why a message failed and help user fix it

**Traditional Approach** (without template system):

```
1. User reports: "Message failed"
2. Support checks logs
3. Finds error code: 132000
4. Googles error code
5. Learns: Template not approved
6. Checks Meta dashboard
7. Confirms template status
8. Explains to user
9. User fixes template
10. User tries again
Time: 30-60 minutes
```

**With Template System**:

```
1. User reports: "Got error 'Template not found'"
2. Support checks RS Connect
3. Sees: Template "xyz" not in approved list
4. Checks last sync: 3 days ago
5. Runs manual sync
6. Template appears as PENDING
7. Explains: "Template is waiting for approval"
8. Shows how to check approval status
9. User monitors and retries when approved
Time: 5-10 minutes
```

**Outcome**: Faster resolution, clearer communication

---

## Admin Features

### Template Dashboard

**What It Shows**:

```
Templates Overview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Transport: WhatsApp Main Channel
Last Synced: 2 hours ago
Status: Healthy ✓

Active Templates: 12
Pending Approval: 2
Disabled: 3
Total Messages (7 days): 45,678

[Sync Now] [View All] [Add New]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recent Template Activity:

✓ order_confirmation
   Status: APPROVED
   Usage (7d): 15,234 messages
   Success Rate: 99.8%
   Last Used: 5 minutes ago
   [View Details] [Test Send]

✓ appointment_reminder
   Status: APPROVED
   Usage (7d): 8,902 messages
   Success Rate: 98.5%
   Last Used: 1 hour ago
   [View Details] [Test Send]

⏳ new_year_promo
   Status: PENDING APPROVAL
   Submitted: Jan 14, 2026 (1 day ago)
   Waiting on: Meta Business Manager
   [Check Status] [View in Meta]

❌ holiday_sale
   Status: DISABLED
   Disabled: Jan 13, 2026 (2 days ago)
   Reason: Policy violation
   Impact: 145 failed messages
   [View Details] [Recreate Template]
```

---

### Template Details View

**What It Shows** (for a specific template):

```
Template: order_confirmation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Basic Information:
  Template ID: order_confirmation_v2
  Display Name: Order Confirmation
  Status: APPROVED ✓
  Transport: WhatsApp Main Channel
  Language: English (en)
  Category: Utility
  Created: Dec 15, 2025
  Last Updated: Jan 10, 2026
  Last Synced: 2 hours ago

Template Content:
  "Hi {{1}}, your order {{2}} is ready for pickup
   at {{3}}. Please bring your order confirmation."

Parameters:
  1. customer_name (text) - Customer's full name
  2. order_id (text) - Order number
  3. location (text) - Pickup location

Usage Statistics (Last 30 Days):
  Total Messages: 45,678
  Successful: 45,567 (99.8%)
  Failed: 111 (0.2%)
  Average per Day: 1,522
  Peak Day: 2,845 (Jan 12)

Recent Usage:
  Jan 15: 1,234 messages (so far)
  Jan 14: 1,890 messages
  Jan 13: 2,845 messages
  Jan 12: 1,456 messages

Example Request:
  {
    "message": {
      "content": "order_confirmation",
      "meta": {
        "templateName": "order_confirmation",
        "components": [
          {"type": "body", "parameters": [
            {"type": "text", "text": "John Doe"},
            {"type": "text", "text": "ORD-12345"},
            {"type": "text", "text": "Main Street Store"}
          ]}
        ]
      }
    }
  }

[Edit in Provider] [Test Send] [Disable] [View Logs]
```

---

### Sync History

**What It Shows**:

```
Template Sync History
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Jan 15, 2026 10:45:00 - Manual Sync
  Triggered by: admin@example.com
  Duration: 2.3 seconds
  Changes: 5 templates affected
  Status: Completed ✓
  [View Details]

Jan 15, 2026 02:00:00 - Automatic Sync
  Duration: 1.8 seconds
  Changes: 2 templates affected
  Status: Completed ✓
  Alert Sent: Yes (template disabled)
  [View Details]

Jan 14, 2026 02:00:00 - Automatic Sync
  Duration: 1.5 seconds
  Changes: 0 templates affected
  Status: Completed ✓

Jan 13, 2026 15:30:00 - Manual Sync
  Triggered by: developer@example.com
  Duration: 2.1 seconds
  Changes: 3 templates affected
  Status: Completed ✓
  [View Details]

[View Full History] [Export Report]
```

---

## Error Messages Reference

### For Users (API Responses)

#### TEMPLATE_NOT_APPROVED

```
Status: 400 Bad Request
{
  "error": "ValidationError",
  "message": "Template '{name}' not found or not approved",
  "code": "TEMPLATE_NOT_APPROVED",
  "field": "message.meta.templateName",
  "help": {
    "description": "This template doesn't exist in RS Connect or is not approved",
    "actions": [
      "Check available templates: GET /templates?transport={id}",
      "Create template in provider dashboard",
      "Wait for approval (24-48 hours)",
      "Sync templates: POST /templates/sync"
    ]
  }
}
```

**What User Should Do**:

1. Check if template exists in provider (Meta, Twilio, etc.)
2. If exists, ask admin to sync templates
3. If doesn't exist, create it in provider
4. Wait for approval
5. Try again after sync

---

#### PARAMETER_COUNT_MISMATCH

```
Status: 400 Bad Request
{
  "error": "ValidationError",
  "message": "Template '{name}' requires {expected} parameters but received {actual}",
  "code": "PARAMETER_COUNT_MISMATCH",
  "field": "message.meta.components",
  "details": {
    "template": "order_confirmation",
    "expected": 2,
    "received": 1,
    "parameter_definitions": [
      {"index": 1, "name": "customer_name", "type": "text"},
      {"index": 2, "name": "order_id", "type": "text"}
    ]
  }
}
```

**What User Should Do**:

1. Check how many parameters the template needs
2. Verify your request includes all required parameters
3. Match parameter types (text, image, etc.)
4. Update request and retry

---

#### TEMPLATE_DISABLED

```
Status: 400 Bad Request
{
  "error": "ValidationError",
  "message": "Template '{name}' has been disabled by the provider",
  "code": "TEMPLATE_DISABLED",
  "field": "message.meta.templateName",
  "details": {
    "template": "holiday_sale",
    "disabled_date": "2026-01-13",
    "reason": "Policy violation",
    "impact": "Template cannot be used for new messages"
  },
  "help": {
    "actions": [
      "Check provider dashboard for specific reason",
      "Fix policy violation if applicable",
      "Create new compliant template",
      "Use alternative template"
    ]
  }
}
```

**What User Should Do**:

1. Check why template was disabled in provider dashboard
2. Fix the issue (if possible)
3. Create new template with compliant content
4. Update application to use new template

---

### For Admins (System Alerts)

#### Template Disabled Alert

```
Priority: High
Subject: Template Disabled - Immediate Action Required

Template "order_confirmation" has been disabled by WhatsApp.

Details:
- Transport: WhatsApp Main Channel
- Disabled Date: Jan 13, 2026
- Reason: Policy violation - promotional content in utility template
- Usage Impact: 1,234 messages/day average

Immediate Impact:
- New broadcasts using this template will fail
- Existing scheduled messages will fail
- Applications need to be updated

Actions Required:
1. Review provider dashboard for detailed reason
2. Update template content to comply with policies
3. Resubmit for approval
4. Update applications to use alternative template during approval
5. Monitor error rates

Affected Applications:
- Order Management System
- Customer Notification Service
- Inventory Alert System

View Details: [Link]
View Provider Dashboard: [Link]
```

---

#### Sync Failed Alert

```
Priority: Medium
Subject: Template Sync Failed

Automatic template sync failed for WhatsApp Main Channel.

Details:
- Scheduled Time: Jan 15, 2026 02:00:00
- Error: API authentication failed
- Retry Count: 3
- Status: Failed

Potential Causes:
- API access token expired
- Provider API unavailable
- Network connectivity issues
- Rate limit exceeded

Impact:
- Template statuses may be outdated
- New templates not reflected in system
- Recent status changes not detected

Actions Required:
1. Verify API credentials are current
2. Check provider service status
3. Run manual sync to verify connectivity
4. Review system logs for detailed errors

Next Automatic Sync: Jan 16, 2026 02:00:00

Run Manual Sync: [Link]
View Logs: [Link]
```

---

## Best Practices

### For Developers

**DO**:

- ✓ Always check available templates before sending
- ✓ Cache template lists in your application (refresh daily)
- ✓ Handle validation errors gracefully with fallbacks
- ✓ Test with all required parameters before production
- ✓ Monitor template usage and success rates
- ✓ Use template IDs consistently across environments

**DON'T**:

- ✗ Hardcode template names without checking availability
- ✗ Ignore validation errors (they prevent waste)
- ✗ Assume templates are always available
- ✗ Skip parameter validation in your code
- ✗ Use production templates in development without care
- ✗ Create templates without proper approval workflow

---

### For Admins

**DO**:

- ✓ Sync templates regularly (at least daily)
- ✓ Monitor template status changes
- ✓ Set up alerts for critical template issues
- ✓ Document template approval process
- ✓ Maintain template usage statistics
- ✓ Review and clean up unused templates
- ✓ Test new templates before production use

**DON'T**:

- ✗ Disable templates without notifying users
- ✗ Ignore pending approval templates for too long
- ✗ Skip manual syncs when issues reported
- ✗ Forget to update documentation when templates change
- ✗ Allow template names to be reused with different content
- ✗ Neglect template performance metrics

---

### For Organizations

**DO**:

- ✓ Establish template governance process
- ✓ Assign template ownership and responsibility
- ✓ Create template naming conventions
- ✓ Document all active templates and their purpose
- ✓ Plan for template deprecation lifecycle
- ✓ Train developers on template requirements
- ✓ Monitor compliance with provider policies

**DON'T**:

- ✗ Let anyone create templates without review
- ✗ Use templates across different purposes
- ✗ Skip testing before submitting for approval
- ✗ Ignore provider policy updates
- ✗ Fail to plan for template rejection scenarios
- ✗ Overlook template versioning needs

---

## Troubleshooting Guide

### Problem: Message Fails with "Template Not Found"

**Symptoms**:

- User gets validation error immediately
- Error code: TEMPLATE_NOT_APPROVED
- No session created

**Diagnostic Steps**:

1. Check if template exists in RS Connect

   - Go to template dashboard
   - Search for template name
   - Check status

2. If not found, check provider

   - Log into provider dashboard
   - Search for template
   - Check if it exists

3. If exists in provider but not RS Connect

   - Check last sync time
   - Run manual sync
   - Verify it appears after sync

4. If exists but status is not APPROVED
   - Check approval status in provider
   - Wait for approval if pending
   - Fix and resubmit if rejected

**Solutions**:

- **Template doesn't exist**: Create in provider, wait for approval, sync
- **Template pending**: Wait for approval, check daily
- **Template rejected**: Fix issues, resubmit, sync when approved
- **Sync is stale**: Run manual sync
- **Wrong template name**: Use correct name from template list

---

### Problem: Message Fails with "Wrong Number of Parameters"

**Symptoms**:

- Validation error immediately
- Error code: PARAMETER_COUNT_MISMATCH
- Clear indication of expected vs received

**Diagnostic Steps**:

1. Check template definition

   - View template details in RS Connect
   - Count how many parameters it needs
   - Note parameter types (text, image, etc.)

2. Check your request

   - Count how many parameters you're sending
   - Verify parameter types match
   - Check parameter order

3. Review template in provider
   - Sometimes templates are updated
   - Parameters may have changed
   - Sync may be needed

**Solutions**:

- **Too few parameters**: Add missing parameters to request
- **Too many parameters**: Remove extra parameters
- **Wrong types**: Match parameter types to template definition
- **Wrong order**: Reorder parameters to match template
- **Template changed**: Update your code to match new template definition

---

### Problem: Template Sync Fails

**Symptoms**:

- Sync button shows error
- Alert email received about sync failure
- Templates are outdated
- Sync history shows failed attempts

**Diagnostic Steps**:

1. Check system logs

   - Look for API errors
   - Check authentication errors
   - Review network issues

2. Verify credentials

   - Check access token is current
   - Verify token has correct permissions
   - Test token in provider API directly

3. Check provider status

   - Visit provider status page
   - Check for known outages
   - Verify API endpoints are responding

4. Review rate limits
   - Check if rate limits exceeded
   - Review sync frequency
   - Verify API quota

**Solutions**:

- **Expired token**: Generate new access token, update in RS Connect
- **Insufficient permissions**: Update token permissions in provider
- **Provider outage**: Wait and retry, monitor provider status
- **Rate limit**: Reduce sync frequency, upgrade API tier if needed
- **Network issue**: Check connectivity, firewall rules, DNS

---

### Problem: High Template Validation Failure Rate

**Symptoms**:

- Many messages failing validation
- Users complaining about errors
- Dashboard shows high validation error rate

**Diagnostic Steps**:

1. Check error patterns

   - What error codes are most common?
   - Is it one template or many?
   - Is it one application or many?

2. Review recent changes

   - Were templates updated recently?
   - Did provider policies change?
   - Was there a sync issue?

3. Analyze usage patterns
   - Which applications are affected?
   - What templates are problematic?
   - When did failures start?

**Solutions**:

- **Stale sync**: Run manual sync immediately
- **Template disabled**: Create replacement, notify users
- **Application bugs**: Fix parameter handling in applications
- **Policy changes**: Update templates to comply
- **Wrong template usage**: Educate developers on correct templates

---

## Maintenance Tasks

### Daily (Automated)

**Template Sync**

- **When**: Every 24 hours (2 AM)
- **What**: Sync all templates from all transports
- **Duration**: 1-5 seconds per transport
- **Monitoring**: Alerts sent if sync fails
- **Action Required**: None unless alert received

**Health Check**

- **When**: Every hour
- **What**: Verify templates are accessible, database is healthy
- **Duration**: <1 second
- **Monitoring**: Dashboard status indicator
- **Action Required**: None unless status unhealthy

---

### Weekly (Manual)

**Template Review**

- **When**: Every Monday morning
- **What**: Review template usage and status
- **Steps**:
  1. Check dashboard for any warnings
  2. Review pending approval templates
  3. Check for unused templates (consider removing)
  4. Verify high-usage templates are healthy
- **Duration**: 10-15 minutes
- **Action Required**: Address any issues found

**Sync Verification**

- **When**: Every Friday afternoon
- **What**: Manual sync to ensure weekend coverage
- **Steps**:
  1. Run manual sync for all transports
  2. Review sync results
  3. Address any discrepancies
- **Duration**: 5 minutes
- **Action Required**: Fix any sync issues before weekend

---

### Monthly (Manual)

**Usage Analysis**

- **When**: First week of each month
- **What**: Analyze template usage and performance
- **Steps**:
  1. Generate usage report
  2. Identify top templates
  3. Find unused templates
  4. Review success rates
  5. Plan optimizations
- **Duration**: 30-60 minutes
- **Deliverable**: Usage report and recommendations

**Template Cleanup**

- **When**: Mid-month
- **What**: Archive or remove old templates
- **Steps**:
  1. Identify templates not used in 90 days
  2. Verify with stakeholders
  3. Disable or remove unused templates
  4. Document removals
- **Duration**: 30 minutes
- **Impact**: Cleaner template list, better performance

**Documentation Update**

- **When**: End of month
- **What**: Update template documentation
- **Steps**:
  1. Review all active templates
  2. Update descriptions
  3. Add new templates to docs
  4. Remove deprecated templates
  5. Update examples
- **Duration**: 1-2 hours
- **Deliverable**: Updated template documentation

---

## Benefits Summary

### For the Organization

**Cost Savings**:

- Prevent wasted API calls (each call costs money)
- Reduce support ticket volume by 40-60%
- Decrease developer time spent debugging
- Lower infrastructure costs (less queue processing)

**Operational Efficiency**:

- Faster time to resolution for issues
- Proactive issue detection
- Better visibility into message delivery
- Improved compliance with provider policies

**Risk Reduction**:

- Prevent messages that will fail anyway
- Early detection of template issues
- Better audit trail
- Compliance with provider requirements

---

### For Developers

**Faster Development**:

- Discover available templates via API
- Clear error messages save debugging time
- Test messages without trial and error
- Examples and documentation built-in

**Better User Experience**:

- Immediate feedback instead of delayed failures
- Clear instructions when something is wrong
- Predictable behavior
- Fewer production issues

**Easier Maintenance**:

- Template changes are visible
- API errors are clearer
- Less firefighting
- More time for features

---

### For End Users

**Reliability**:

- Messages more likely to be delivered
- Faster failure detection
- Clearer error messages
- Better overall experience

**Transparency**:

- Know immediately if something is wrong
- Understand what needs to be fixed
- Track message status accurately
- Trust the system more

---

## Conclusion

The Template Verification System transforms message sending from a "hope it works" approach to a "know it will work" approach. By validating before queueing, the system:

- **Saves resources** by catching errors early
- **Improves user experience** with immediate, clear feedback
- **Reduces operational burden** through proactive monitoring
- **Ensures compliance** with provider requirements
- **Provides visibility** into what's available and what's working

The system is designed to be optional and backward-compatible—transports without verification continue working as before, while transports with verification gain all these benefits without disrupting existing functionality.
