# Security Specification — PASHU MARKET

## 1. Data Invariants
1. **Owner-Isolated PII (`/users/{userId}`)**: A user's private profile (`phone`, `email`, `role`, `verified`, `suspended`) is readable only by that user or an authorized admin. A user can never set `role: 'admin'`, `verified: true`, or `suspended: false` on their own document.
2. **Public Seller Summary (`/sellers/{sellerId}`)**: Only non-sensitive display metadata (`name`, `photoURL`, `state`, `district`, `village`, `verified`, `memberSince`) is publicly readable; `verified` and `suspended` are admin-controlled.
3. **Listing Ownership & Immediate Public Visibility (`/animals/{listingId}`)**: Only authenticated, non-suspended users can create listings, and `sellerId` must equal `request.auth.uid`. `sellerVerified` cannot be forged by non-admins. Public users can only `get` or `list` listings whose `status == 'ACTIVE'` (owners can read/list their own regardless of status).
4. **Private Enquiries (`/enquiries/{enquiryId}`)**: An enquiry can only be read or listed by its `buyerId`, its `sellerId`, or an admin. Only `buyerId == request.auth.uid` can create an enquiry for an existing active listing.
5. **Admin Exclusivity (`/admins/{adminId}`, `/categories`, `/appSettings`, `/reports`)**: Only bootstrapped verified admin (`armankalesiya@gmail.com`) or users present in `/admins/{uid}` can manage categories, announcements, seller verification, user suspension, listing moderation, or report resolution.
6. **Temporal & Structural Integrity**: Document IDs must match `^[a-zA-Z0-9_\-]+$` (`<= 128` chars), all strings enforce explicit `.size()` bounds, arrays enforce `.size() <= 10`, and timestamps must match `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Admin Escalation**: Creating `/users/attacker` with `role: "admin"` -> `PERMISSION_DENIED`.
2. **Self-Verification Spoofing**: Updating `/users/attacker` or `/sellers/attacker` with `verified: true` -> `PERMISSION_DENIED`.
3. **Shadow Ghost Field Injection**: Creating `/animals/list1` with extra `approvedBySystem: true` -> `PERMISSION_DENIED`.
4. **Seller Impersonation**: Creating `/animals/list1` with `sellerId: "victim_uid"` while signed in as `attacker_uid` -> `PERMISSION_DENIED`.
5. **ID Poisoning**: Creating `/animals/../../etc/passwd` or a 500-char ID -> `PERMISSION_DENIED`.
6. **PII Harvesting (`users` blanket read)**: Non-owner listing `/users` or getting `/users/victim_uid` -> `PERMISSION_DENIED`.
7. **Draft/Hidden Listing Scraping**: Anonymous user running `list` on `/animals` without `where('status', '==', 'ACTIVE')` -> `PERMISSION_DENIED`.
8. **Private Enquiry Eavesdropping**: Third-party user reading or listing `/enquiries` belonging to `buyerA` and `sellerB` -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: Creating `/animals/list1` with backdated `publishedAt` not equal to `request.time` -> `PERMISSION_DENIED`.
10. **Photo Array Overflow / Type Poisoning**: Creating `/animals/list1` with `photos: [12345]` or 11 photos -> `PERMISSION_DENIED`.
11. **Terminal State Tampering**: Updating an already `SOLD` listing's `price` or `sellerId` as owner without admin override (or mutating `sellerId` / `publishedAt`) -> `PERMISSION_DENIED`.
12. **Unverified Admin Email Spoof**: Accessing admin routes with `email == 'armankalesiya@gmail.com'` and `email_verified == false` -> `PERMISSION_DENIED`.
