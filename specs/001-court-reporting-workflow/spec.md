# Feature Specification: Court Reporting Workflow Manager

**Feature Branch**: `001-court-reporting-workflow`
**Created**: 2026-05-30
**Status**: Draft
**Input**: Court Reporting Workflow System — assessment document (system-design/vs-full-stack-dev-assessment.md)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Track Jobs (Priority: P1)

An agency staff member receives an audio recording for a court case. They create a new job in the
system by entering the case name, the recording duration, and whether the job requires an in-person
reporter or can be handled remotely. Once created, the job appears on the dashboard with status
NEW and can be tracked as it moves through the workflow.

**Why this priority**: The job is the central entity of the entire system. Nothing else —
assignment, review, payment — can happen without a job record. This story alone delivers a
functioning job registry.

**Independent Test**: Can be tested by creating a job and confirming it appears in the job list
with status NEW and the correct details. No reporters or editors needed.

**Acceptance Scenarios**:

1. **Given** no jobs exist, **When** staff submits a new job with case name "Smith v. Jones", 90
   minutes, physical location, **Then** the job appears in the dashboard with status NEW, correct
   case name, duration, and location type.
2. **Given** a job exists with status NEW, **When** staff views the dashboard, **Then** the job's
   status, case name, duration, and location are visible.
3. **Given** a staff member submits a job with missing required fields, **When** they attempt to
   save, **Then** the system rejects the submission and shows which fields are missing.

---

### User Story 2 - Assign a Reporter to a Job (Priority: P2)

An agency staff member assigns an available court reporter to a NEW job. The system surfaces
reporters who match the job's location preference first (same city for physical jobs), then allows
remote assignment as a fallback. Once assigned, the job status advances to ASSIGNED.

**Why this priority**: Reporter assignment is the first workflow transition and the primary
operational action. Without it, jobs cannot progress. This story makes the system operational for
the most common daily task.

**Independent Test**: Can be tested by creating a job and assigning a reporter, then verifying
the job status changes to ASSIGNED and the reporter's name is linked to the job.

**Acceptance Scenarios**:

1. **Given** a NEW job with physical location in Jakarta, **When** staff assigns a Jakarta-based
   reporter, **Then** the job status changes to ASSIGNED and the reporter is linked to the job.
2. **Given** a NEW job with physical location in Surabaya and no Surabaya reporters available,
   **When** staff assigns a reporter from another city, **Then** the assignment succeeds and the
   job status becomes ASSIGNED.
3. **Given** a NEW job with remote location, **When** staff assigns any available reporter,
   **Then** the assignment succeeds regardless of reporter location.
4. **Given** a job that is already ASSIGNED, **When** staff attempts to assign a second reporter,
   **Then** the system rejects the action with a clear error message.
5. **Given** a reporter marked as unavailable, **When** staff views assignment options for a job,
   **Then** that reporter does not appear in the selectable list.

---

### User Story 3 - Assign an Editor for Review (Priority: P3)

After a reporter completes transcription and the job is manually advanced to TRANSCRIBED status,
an agency staff member assigns an editor to review the transcript. Once assigned, the job status
advances to REVIEWED.

**Why this priority**: Editor assignment completes the two-assignment workflow required by the
assessment. It depends on P1 and P2 being in place, so it is P3.

**Independent Test**: Can be tested by creating a job, assigning a reporter (reaching ASSIGNED),
manually advancing to TRANSCRIBED, then assigning an editor and verifying the job reaches REVIEWED.

**Acceptance Scenarios**:

1. **Given** a job with status TRANSCRIBED, **When** staff assigns an editor, **Then** the job
   status changes to REVIEWED and the editor is linked to the job.
2. **Given** a job with status ASSIGNED (not yet TRANSCRIBED), **When** staff attempts to assign
   an editor, **Then** the system rejects the action with a clear message explaining the job is not
   ready for review.
3. **Given** a job with status REVIEWED, **When** staff marks it as COMPLETED, **Then** the job
   status changes to COMPLETED.

---

### User Story 4 - View Payment Calculations (Priority: P4)

Agency staff can see the payment owed to the reporter and editor for any job. Reporter pay is
calculated from the job duration; editor pay is a flat fee. Both amounts are displayed per job
inline on the dashboard — no separate detail page is required.

**Why this priority**: Payment display requires jobs, reporters, and editors to be in place
(P1–P3). It is the final deliverable of the assessment but does not gate other stories.

**Independent Test**: Can be tested with a COMPLETED job that has both a reporter and editor
assigned. Verify that the displayed reporter pay equals duration × per-minute rate and editor pay
equals the configured flat fee.

**Acceptance Scenarios**:

1. **Given** a job of 90 minutes with a reporter rate of 2000 IDR/min, **When** staff views the
   job's payment summary, **Then** reporter pay shows 180,000 IDR.
2. **Given** a job with an editor assigned at a flat fee of 50,000 IDR, **When** staff views the
   job's payment summary, **Then** editor pay shows 50,000 IDR.
3. **Given** a job with no editor assigned, **When** staff views payment, **Then** editor pay
   shows 0 or "not assigned".

---

### Edge Cases

- A physical job has no reporters in its city → system must still allow assignment from other
  locations (no blocking error); location match is a preference, not a hard gate.
- A job is created with zero or negative duration → system rejects the job at creation time.
- Staff attempts a status transition that skips a step (e.g., NEW → REVIEWED) → system rejects
  with a message explaining the required sequence.
- A reporter is assigned to a job while concurrently being marked unavailable → the existing
  assignment remains; availability only affects new assignment selection.
- Once a job reaches ASSIGNED status, the reporter cannot be replaced — re-assignment is out of
  scope for this assessment.

## Clarifications

### Session 2026-05-30

- Q: Where is the city stored for physical job reporter matching — on the Job, on a system default, or not at all? → A: City is a required field on Job when location type = physical; null/omitted for remote.
- Q: Are reporters and editors managed via UI (CRUD screens) or pre-seeded fixture data only? → A: Pre-seeded only; no create/edit/delete UI for reporters or editors is in scope.
- Q: Is there a separate job detail page, or is all job information (including payment) displayed inline on the dashboard? → A: Single-screen dashboard with all details inline; no separate job detail page needed.
- Q: Can a reporter be replaced on an ASSIGNED job before it reaches TRANSCRIBED? → A: No re-assignment; once ASSIGNED the reporter is locked for this assessment scope.
- Q: SC-006 ("complete workflow without guidance") is untestable — how should it be resolved? → A: Removed; no replacement criterion needed.

### Session 2026-05-31

- Q: Can staff toggle reporter availability through the UI, or is it fixed in seed data? → A: Fixed in seed data only; no UI to change reporter availability.
- Q: How does staff trigger the ASSIGNED→TRANSCRIBED and REVIEWED→COMPLETED status transitions on the dashboard? → A: Action button per job row (e.g., "Mark Transcribed" / "Complete") visible only when the transition is valid.
- Q: Must case names be unique, or can the same case name appear on multiple jobs? → A: Duplicates allowed; no uniqueness constraint on case name.
- Q: What cities should reporter seed data cover to make location-matching demonstrable? → A: Jakarta + Surabaya — matching the cities named in the US2 acceptance scenarios.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow staff to create a job with case name, duration in minutes,
  location type (physical or remote), and — when location type is physical — a required city field
  (null/omitted for remote jobs).
- **FR-002**: System MUST enforce the job status sequence:
  NEW → ASSIGNED → TRANSCRIBED → REVIEWED → COMPLETED.
- **FR-003**: System MUST reject any status transition that does not follow the defined sequence.
- **FR-004**: System MUST allow staff to assign one available reporter to a job in NEW status,
  advancing the job to ASSIGNED.
- **FR-005**: System MUST display reporters in the same city as a physical job before others;
  remote assignment MUST always be offered as an option.
- **FR-006**: System MUST track reporter availability and exclude unavailable reporters from the
  assignment list.
- **FR-007**: System MUST allow staff to assign one editor to a job in TRANSCRIBED status,
  advancing the job to REVIEWED.
- **FR-008**: System MUST calculate reporter payment as: job duration (minutes) × reporter's
  per-minute rate.
- **FR-009**: System MUST calculate editor payment as the editor's configured flat fee per job.
- **FR-010**: System MUST display per-job payment amounts for both reporter and editor.
- **FR-011**: System MUST present a single-screen dashboard listing all jobs with their current
  status, assigned reporter, assigned editor, and payment summary inline — no separate job detail
  page is required.
- **FR-012**: System MUST allow staff to advance a job from ASSIGNED to TRANSCRIBED (confirming
  transcription is done) and from REVIEWED to COMPLETED via a per-row action button on the
  dashboard; the button MUST only be visible when the transition is valid for that job's current
  status.

### Key Entities

- **Job**: A transcription task identified by case name (non-unique; the same case may produce
  multiple jobs), duration (minutes), location type (physical/remote), city (required when
  physical, null when remote), current status, and timestamps for each status change.
- **Reporter**: A court reporter with a name, city (home location), availability flag, and a
  per-minute pay rate.
- **Editor**: A reviewer with a name and a flat per-job fee.
- **Assignment**: The record linking a job to its assigned reporter and/or editor, capturing
  when each assignment was made.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Staff can create a new job and see it on the dashboard in under 30 seconds.
- **SC-002**: All jobs and their current statuses are visible on a single dashboard screen without
  additional navigation.
- **SC-003**: Payment figures for reporter and editor are displayed correctly for 100% of jobs
  that have both parties assigned.
- **SC-004**: Every invalid status transition attempt is rejected with a descriptive error message
  (0 silent failures).
- **SC-005**: Reporter assignment for physical jobs surfaces same-city reporters before others
  in 100% of cases.

## Assumptions

- Single agency operates the system; no multi-tenant isolation is required.
- No user authentication or login is required for this assessment scope — the system is treated
  as an internal tool accessible by all agency staff.
- Reporter per-minute rate is stored per reporter and seeded with 2,000 IDR/min as the default
  example; the rate is configurable per reporter in the data model.
- Editor flat fee is stored per editor and configurable; a default of 50,000 IDR/job is assumed
  for seeded data.
- A reporter has one home city; "same city" matching is a simple string comparison on the
  city field — no geo-distance calculation needed. Reporter seed data covers at minimum Jakarta
  and Surabaya to make location-matching demonstrable against the US2 acceptance scenarios.
- Pagination of the job list is out of scope for this assessment; all jobs are displayed.
- Reporter and editor records are pre-seeded fixture data; no UI for creating, editing, deleting,
  or toggling the availability of reporters or editors is in scope. Reporter availability is fixed
  at seed time and used only to filter the assignment list.
- Payment calculation is display-only — no payment disbursement, invoicing, or export is required.
- The system is web-based and accessed via a browser on a desktop device; mobile is out of scope.
