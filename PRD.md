# CrewSafe — Product Requirements Document
**Version:** 1.0  
**Framework:** Intent-Based Building (7-Day AI App Blueprint)  
**Last Updated:** May 2026

---

## App Overview

CrewSafe is a mobile-first safety hub where field employees can submit 
safety-related incidents and safety administrators can review, investigate, 
and manage those submissions through a role-based admin dashboard.

---

## The One Thing

A crew member can submit a safety incident from a shared device, and an 
admin can review and act on it — closing the accountability loop end to end.

---

## Tech Stack

- **Frontend:** Next.js
- **Backend/Database:** Firebase (Firestore + Auth)
- **Hosting:** Vercel
- **Payments:** Stripe (future use)

---

## Access Model

- **Crew members:** No individual login. Shared device access. 
  Submitter identified by name selection from a dropdown at time of submission.
- **Administrators:** Individual login required via Firebase Auth. 
  Role-based access control unlocks the admin dashboard within the same app.

---

## Core Features

### 1. Mobile-First Incident Submission
Crew members use a shared iPad to submit safety incidents by selecting 
their name from a dropdown and choosing an incident type.

**Incident Types:**
- Hazard Recognition
- Near Miss
- Injury / Illness
- Vehicle Accident

Each type has category-specific form fields. All submissions capture 
the submitter's name, incident type, details, date/time, and an optional 
photo attachment (camera or device library).

**Success Criteria:**
- Submitter selects their name and incident type with no login required
- Category-specific fields are presented based on incident type
- Photo attachment is available on every submission form
- User receives clear success feedback with a gamified congratulations 
  message and leaderboard progress reminder upon successful submission
- User receives clear failure feedback if submission fails
- Submissions are permanent — only admins can delete them

---

### 2. Admin Dashboard
Authenticated admins can review all incoming submissions and manage 
investigations from a centralized dashboard.

**Success Criteria:**
- Admins see all submissions with a default status of "New"
- Admins can update status through the workflow: 
  New → In Review → Review Completed
- Status changes are reflected in real time on the employee-facing 
  "My Reports" screen
- Admins can add investigation notes to any submission
- Admins can forward any incident report via email to others 
  in the organization
- Historical data accumulates and is retained for future use

---

### 3. Heat Illness Prevention
Supervisors can check real-time weather at their current location and 
log a heat illness prevention acknowledgment based on temperature thresholds.

**Temperature Thresholds:**
- 92°F – 99°F
- 100°F – 105°F
- 106°F and above

**Success Criteria:**
- App detects supervisor's current location and pulls live weather data
- Appropriate threshold-based checklist is displayed automatically
- Supervisor checks off available supplies/measures
- A comments box is available to note any missing items
- Every acknowledgment is logged to Firebase with timestamp, 
  location, temperature, checklist results, and comments

---

### 4. Leaderboard & Rewards
Employees earn points for every incident submission. A leaderboard 
displays rankings and milestone progress toward admin-defined rewards.

**Success Criteria:**
- Points are awarded automatically upon each successful submission
- Employees can see their current point total, rank, and distance 
  to the next reward milestone
- Admins can define reward tiers and point thresholds in the admin panel
- Admins receive a notification when an employee reaches a reward milestone
- Rewards are admin-defined — employees cannot choose their reward

---

### 5. User Management & Org Chart
Admins can manage the employee roster and define organizational hierarchy 
including supervisor-to-employee relationships and crew assignments.

**Success Criteria:**
- Admins can enroll new employees into the system
- Admins can deactivate terminated employees
- Admins can assign supervisors to employees
- Admins can create and manage crews (groundwork for v2 team rewards)
- Employee names in the submission dropdown are pulled from this roster

---

## Core User Flow

**Crew Member Flow:**
1. Crew member opens CrewSafe on shared iPad
2. Greeted with home screen and a floating action button to report an incident
3. Selects their name from a dropdown
4. Selects incident type (Hazard, Near Miss, Injury/Illness, Vehicle Accident)
5. Fills out category-specific form fields and optionally attaches a photo
6. Submits the report
7. Receives gamified success screen with leaderboard progress reminder
8. Can revisit submissions anytime in "My Reports" — cannot delete

**Admin Flow:**
1. Admin opens CrewSafe and logs in with individual credentials
2. Role-based access unlocks the admin dashboard
3. Admin sees all submissions — new submissions appear with "New" status
4. Admin opens a submission and begins investigation — status changes to 
   "In Review" (visible to the submitting employee)
5. Admin adds investigation notes and optionally forwards report via email
6. Admin marks submission as "Review Completed" — loop is closed
7. Data is retained historically in Firebase

---

## Out of Scope for V1

- Team/crew-based reward system
- Push notifications (email only for admin alerts in v1)
- Analytics or reporting dashboards with charts and trends
- Multi-company or multi-organization support

---

## Version 2 Ideas

- Crew-based team leaderboard and group rewards
- Push notifications for status updates and reward milestones
- Analytics dashboard with incident trends, heat map by location, 
  and submission history charts
- Multi-organization support
- PDF export of incident reports