# Google Play Console Publishing Status

This document tracks the steps completed and remaining in the Google Play Console for releasing our application.

---

## 1. Steps Completed
* **App Setup & Configuration**:
  - App created in the Google Play Console.
  - Package identity set up for the resident portal bundle.
* **Internal Testing Release**:
  - Generated and uploaded the signed App Bundle (`.aab`) to the **Internal testing** track.
  - Release submitted successfully.
  - Build is live/pending automatically for the designated internal testers list.

---

## 2. Next Steps (Required before Closed/Open Testing or Production)

### Step A: Set up Store Presence
* Go to **Grow ➔ Store presence ➔ Main store listing** and upload:
  - [ ] **App Icon** (512x512 PNG/JPEG)
  - [ ] **Feature Graphic** (1024x500 PNG/JPEG)
  - [ ] **Phone Screenshots** (At least 2 screenshots, aspect ratio 16:9 or 9:16)
  - [ ] Short and full descriptions of the app.

### Step B: App Access Credentials (Crucial for Review)
* Go to **Policy and programs ➔ App content ➔ App access**.
* Select **"All or some parts of my app are restricted"**.
* [ ] Add a new set of credentials (username/password) for a dummy test user so that Google's reviewers can successfully log in and explore the app.

### Step C: Complete App Content Questionnaires
* Under **Policy and programs ➔ App content**, complete:
  - [ ] Privacy Policy url
  - [ ] Ads questionnaire (select "No")
  - [ ] Content Rating
  - [ ] Target Audience and Content
  - [ ] Data Safety form (documenting what user data is collected/stored)
  - [ ] Financial Features declaration (if handling rent payments directly)

### Step D: Testing & Public Launch
* Promote the build to:
  - [ ] **Closed Testing** (Requires 20 testers for 14 days continuously for personal developer accounts)
  - [ ] **Production** (To release to the general public)
