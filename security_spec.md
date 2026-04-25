# Security Specification: Understandable.io (v2)

## 1. Data Invariants
- An Explanation cannot exist without a valid concept.
- Feedback must link to a valid User ID and Explanation ID.
- UserSession must link to a valid User ID.
- Access to PII (None currently, but if added) must be restricted to owner.

## 2. The Dirty Dozen (Payloads)
1. **User Spoofing:** Creating a user document with someone else's `userId`.
2. **Field Injection (User):** Creating a user with `isAdmin: true` (if applicable).
3. **Ghost Field (User):** Updating user profile with `role: 'admin'`.
4. **Invalid Concept ID (Explanation):** Creating/Updating with a 2KB string for `conceptId`.
5. **State Shortcut (Feedback):** Updating a feedback record that has already been submitted.
6. **Orphaned Feedback:** Creating feedback for a non-existent Explanation ID.
7. **Identity Theft (Feedback):** Creating feedback where `userId` != `request.auth.uid`.
8. **Resource Exhaustion:** Updating an array (e.g., tags) with 10,000 items.
9. **Timestamp Manipulation (Create):** Creating document with `createdAt: 10 years ago`.
10. **Timestamp Manipulation (Update):** Updating `createdAt`.
11. **Refinement Spoofing:** Submitting a refinement with `voteCount: 99999`.
12. **Query Bypass (List):** attempting a `list` query that fetches documents not owned by the user.

## 3. Test Cases (firestore.rules.test.ts)
... (To be implemented using Firebase Emulator SDK syntax) ...
