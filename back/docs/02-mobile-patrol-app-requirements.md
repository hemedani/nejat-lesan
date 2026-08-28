# Mobile App Requirements Documentation (Patrol Officer)

## 1. Login / Authentication Screen

*   **Visual Identity:** At the top of the screen, include the system logo and the title "Accident Registration and Management System", with a short subtitle "Patrol Officer Login". The design should be formal, private, and coordinated with the blue theme of the current system.
*   **Username:** Preferably use "Personnel Code" as the username. This field must accept **numeric values only**, and the `Paste` function should be disabled.
*   **Password Field:** Include a show/hide icon for the password. The password must be hidden by default.
*   **Primary CTA (Call to Action):** A large "Login to System" button. This button must remain disabled (inactive) until both the personnel code and password are entered.
*   **Save Login Info:** Instead of saving the password, save the authentication `Token` securely on the device. The user should not be forced to re-enter their Username/Password on subsequent app launches.
*   **Quick Subsequent Login:** After the first successful login, the officer should be able to log in using a short **PIN** or **Biometrics** (Fingerprint / Face ID). This capability should be optional and configurable via the settings.
*   **First Login Must Be Online:** Because the server needs to validate the officer's identity and access to patrol units/vehicles, the very first login requires an active internet connection. A clear message should be displayed if the officer attempts to log in offline for the first time (e.g., "Internet connection is required for initial setup").
*   **Offline Login in Subsequent Times:** The app is **Offline-First**. If the officer has successfully logged in before, the app should cache the data and allow offline login. Once an internet connection is re-established, the session should automatically validate and sync with the server.
*   **Connection Status Message:** Display a small status indicator at the top or bottom of the form (e.g., "Online" or "Offline"). Being offline should never prevent subsequent logins.
*   **Forgot Password:** Include a link saying "Forgot your password?". It is better to rely on organizational mechanisms (e.g., contacting the system admin or via a registered mobile number) rather than building an active, complex recovery process inside the mobile UI.
*   **Error Display:** Show precise, user-friendly error messages such as:
    *   "Personnel code or password is incorrect."
    *   "User account is inactive."
    *   "This account does not have permission to use the patrol officer app."
    *   "Internet connection is required for the first login."
    *   *Note: Never show raw Backend error messages to the user.*
*   **Preventing Repeated Failed Logins:** Apply a time limit or server-side security policy after several failed attempts. Clearly inform the user of the lockout.
*   **Device Registration:** On the first successful login, the Backend should register the device ID/fingerprint. This allows the system administrator to see which devices are active for each officer and remotely revoke the session if the device is lost or stolen.
*   **User Session:** Upon successful login, route the user directly to the **Home Dashboard**. If the app is restarted and the session is still valid, bypass the login screen entirely and authenticate directly via PIN/Biometrics.
*   **Do Not Show Shift Info on Login:** Information such as shift details, patrol unit, vehicle, GPS, and internet status belongs on the Home Dashboard. Do not clutter the Login screen with this data.
*   **Post-Login Permissions:** The Backend must specify the user's capabilities based on their account role (e.g., permission to register accidents, view maps, or see announcements). **Do not hardcode permissions in the mobile app.**
*   **Local Security:** Never save passwords in plain text. Tokens and sensitive local data must be stored in **Secure Storage** (e.g., Keychain/Keystore).
*   **App Lock Timeout:** If the app goes to the background or the phone locks for a specific duration, a quick lock screen requiring only a PIN or Biometric is sufficient; do not demand the full Username/Password again.
*   **RTL and Keyboard:** The entire page must be RTL (Right-to-Left) and in Persian. Use a **Numeric Keyboard** for the Personnel Code and a standard keyboard for the Password.
*   **Loading State:** Show a loading state on the "Login" button after it is tapped. Prevent multiple simultaneous requests.
*   **App Version:** Display the version number (e.g., `1.0.0`) in very small text at the bottom of the screen for technical support purposes.
*   **Support:** Include a small link at the bottom: "Problem logging in? Contact support." Ensure it does not clutter the UI.

---

## 2. Patrol Officer Home Dashboard

This is the main screen of the mobile application and the starting point for the patrol officer's daily activities.

### Core Objectives
1.  **Offline-First Architecture:** Internet disconnection must never prevent incident registration. Reports are saved locally as "Drafts". Upon tapping "Send", if online, it sends immediately. If offline, it is queued in an internal sync page and automatically sent the moment the connection is restored, without requiring further action from the officer.
2.  **Identity & Status:** Instantly tell the officer: "Who am I, what vehicle am I in, what shift am I on, and what is my GPS/Internet status?"
3.  **Quick Access:** Fast routing to register new incidents, view drafts, maps, and announcements.

### Page Structure (Top to Bottom)
*   **Header:** Blue background displaying Officer Name, Role (e.g., Patrol Expert), and Profile Picture (or default avatar/initials). Data is read-only from the user profile.
*   **Patrol Unit & Vehicle:** An independent bar showing the active Patrol Unit (e.g., `123`) and Vehicle (e.g., `Iran Plate ...`). This data must dynamically reflect the officer's **active shift profile**, not static data.
*   **Shift Status Card:** Displays the current shift (e.g., Morning: 07:00 - 15:00).
    *   *Active* (Green)
    *   *Nearing End* (Orange)
    *   *Ended* (Grey)
    *   *Out of Shift* (Red/Grey)
    *   *Shift Info Not Received* (Warning). *Note: This status should ideally be fetched from the server, not just the device clock.*
*   **Internet Connection Status Card:**
    *   *Online* (Green)
    *   *Weak Connection* (Orange)
    *   *Offline* (Red/Grey). *Crucial: Being offline must NOT disable buttons for registering incidents, editing drafts, taking photos/videos/audio, or using GPS.*
*   **GPS Status Card:** Shows accuracy and quality (e.g., Accurate <10m, Moderate 10-30m, Weak >30m, Unavailable). If GPS is off or permissions are denied, tapping the card should prompt the user to enable Location Services.
*   **Last Sync Status:** A small text line under the status cards (e.g., "Last sync: Today 09:32"). If reports are waiting to sync, show: "3 reports waiting for auto-sync".

### Key Actions & Features
*   **"Register New Incident" (Primary CTA):** The largest, most prominent button. Tapping it opens the Map/Location Picker. It must **never** be disabled due to offline status. If offline, it shows a toast: "You are offline. Data will be saved on device and synced when connected to the internet."
*   **"Declare Emergency" Button:** Distinct from incident registration. Tapping it opens a Bottom Sheet confirmation showing the officer's current GPS location, name, unit, and vehicle. If confirmed, it sends an immediate SOS to the control center. If there is no internet, it should attempt to send an SMS or trigger a phone call to the emergency center.
*   **Drafts:** Shows a badge with the count of unsent reports. Tapping it opens the Drafts list.
*   **Auto-Save:** Forms must auto-save at every step (e.g., changing fields, taking a photo, recording audio, navigating back, or app going to background). The user must never lose data due to a phone call or app crash.
*   **My Reports:** Allows the officer to view their past reports and their statuses (Sent, Under Review, Approved, Returned for Correction). If returned, highlight what needs fixing.
*   **Announcements:** Shows unread messages from the control center (e.g., correction requests, operational alerts). Tapping opens the Notification Center.
*   **Map:** A read-only map for the officer to view their location, freeway routes, kilometers, and previously registered incidents.
*   **Bottom Navigation:** 5 tabs (RTL order): Reports, Announcements, **Home** (Center, larger, blue when active), Map, More.
*   **"More" Menu:** Includes User Profile, Shift Info, Vehicle Info, Settings, Guide, Support, About, and Logout.

### Technical & UX Rules
*   **Preventing Duplicate Registration (Idempotency):** The API must be idempotent. The app generates a UUID (`client_report_uuid`) for every draft. The server must check this UUID to prevent duplicate records if the app retries sending due to network drops.
*   **Sync Notifications:** Use native OS notifications to inform the user of sync results (e.g., "Sync successful: 3 reports sent" or "Sync failed: Data saved, will retry").
*   **Pull-to-Refresh:** Refreshes shift, vehicle, announcements, reports, and sync status.
*   **Startup Behavior:** Show cached data immediately upon opening. Do not make the user wait for the network. Sync profile, shifts, and announcements in the background.
*   **Permissions Required:** Location (GPS), Camera, Microphone, Notifications.
*   **Auto-Logout:** Due to the nature of patrol work, frequent logins are annoying. Use long-lived sessions or Refresh Tokens. Require a PIN/Biometric only after a long period of inactivity.
*   **Sunlight Readability:** High contrast, avoid very light grey text. Primary CTAs must be distinctly blue, warnings clearly red.
*   **Touch Targets:** Minimum 44-48dp. "Register Incident" and "Emergency" buttons must be exceptionally large for operational environments.
*   **App Closure Behavior:** If the app is force-closed or the phone restarts, drafts, media files, and the sync queue must persist and resume upon next launch.

---

## 3. Incident Location Picker

**Goal:** Before asking the officer *what* happened, this screen determines exactly *where* it happened on the freeway. No extra forms should be shown here.

### Map & Selection Features
1.  **Auto-Center:** On load, the map zooms into the officer's current GPS location, marked with a distinct "Officer Location" pin.
2.  **Tap-and-Hold / Pin Selection:** The map moves freely while a fixed Pin remains in the center of the screen. The point directly under the Pin is selected. (This is more precise than tapping the glass).
3.  **"My Current Location" Button:** A GPS button to instantly snap the map back to the officer's live location.
4.  **Separate Officer & Incident Coordinates:** The system must record *both* the GPS coordinates of the device at the time of registration AND the exact map coordinates of the selected incident point. This is vital for Audit Trails and data quality control.
5.  **Display GPS Accuracy:** Show accuracy status (e.g., `±6 meters`). If accuracy is low, show a warning but still allow manual map selection.
6.  **Freeway Route Display:** Clearly highlight the freeway route (e.g., `Ahvaz -> Imam Reza`). The officer must be able to distinguish between parallel opposite-direction lanes.
7.  **Linear Referencing (Km + Meter):** Once a point is selected, the system automatically calculates the exact Freeway Kilometer and Meter (e.g., `Km 45 + 320m`). **The officer must not have to type this manually.**
8.  **Direction Detection:** Based on the route, auto-suggest the travel direction. Allow the officer to manually correct it if the map is ambiguous.
9.  **Lane / Crossing Line Selection:** After choosing the point, prompt the officer to select the specific lane (Line 1, Line 2, Left Shoulder, Right Shoulder, Median). Show this in a bottom panel, not on the map.
10. **Snapping to Road:** If the selected Pin is within a few meters of the road axis, the system should automatically "snap" the point to the nearest valid road segment. Do this silently without interrupting the user.
11. **Bottom Sheet Summary:** As the map moves, a bottom panel should continuously update showing: Route, Direction, Km+Meter, Lat/Lng, and Distance from Officer.
12. **Distance Warning:** If the selected point is far from the officer's actual GPS location (e.g., `Distance to you: 120m`), show a warning to prevent random point selection.
13. **Map Types:** Allow toggling between "Base Map" and "Satellite View". Satellite is highly useful for identifying bridges, ramps, and facilities.
14. **Offline Map:** The map, routes, and linear referencing logic must be pre-cached/downloaded. This screen must work flawlessly without an internet connection.
15. **Manual Selection (No GPS):** If GPS is denied or unavailable, the app must not crash. Allow the officer to manually pan the map and select a location, but log a "GPS Unavailable" warning in the backend.
16. **Boundary Warnings:** If the officer selects a point outside the valid freeway jurisdiction, warn them: "Selected location is outside freeway boundaries. Are you sure?"
17. **Confirm Location Button:** A large, fixed CTA at the bottom: "Confirm Incident Location". Tapping this saves the draft and moves to the next step.
18. **Correction Capability:** The confirmed location is not permanently locked. In subsequent steps, provide a "Edit Location" button that returns the user to this exact screen with the pin preserved.

---

## 4. Accident Registration Form - General Structure

The form is divided into sequential, logical phases.

### Phase 1: Basic Information
*   **Auto-filled Data:**
    *   Unique Report ID (Auto-generated based on incident type, officer code, date).
    *   Officer Name & Personnel Code.
    *   Patrol Unit / Vehicle.
    *   Date & Time of Report Creation.
    *   Geographic Coordinates (Read-only, from Location Picker).
    *   GPS Accuracy.
    *   Travel Direction & Route.
    *   Kilometer + Meter (Linear Referencing).
    *   Crossing Line / Lane.
*   **Officer-Entered Data:**
    *   **Exact Date of Accident:** (Defaults to current date, editable).
    *   **Exact Time of Accident:** (Defaults to current time, editable).

### Phase 2: Accident Classification
*   **Severity:**
    *   Damage-only (Property Damage)
    *   Injury
    *   Fatal *(If selected, the "People/Injured" section becomes mandatory).*
*   **Collision Type:**
    *   Vehicle with Vehicle
    *   Vehicle with Motorcycle
    *   Vehicle with Pedestrian
    *   Vehicle with Bicycle
    *   Vehicle with Fixed Object
    *   Overturn / Rollover
    *   Run-off-road (Deviation from path)
    *   Fall from Bridge / Height
    *   Multi-vehicle collision
    *   Animal Collision
    *   Unknown

### Phase 3: Police and Croquis (Sketch Report) Information
*   **Question:** "Is Police present at the scene?"
*   **If Yes, show fields:**
    *   Police Station / Unit.
    *   Police Expert Name.
    *   Police Arrival Time.
    *   **Was a Croquis (Sketch) drawn?**
        *   *Series 12 (With Sketch)*
        *   *Series 22 (Without Sketch)*
    *   Officer's descriptive notes on the cause of the accident.

### Phase 4: Involved Vehicles
*   *Prompt for the number of vehicles involved, then generate a Card for each vehicle.*
*   **Vehicle Specs:** Type (Sedan, SUV, Truck, Bus, Motorcycle, Construction, Ems, etc.), Plate Number, Plate Image, Usage, Brand, Model, Color, Year, Final Status (Stopped, Overturned, Off-road, Caught fire, etc.).
*   **Driver Specs:** Name, Phone, National ID (Optional/Limited), License Number.
*   **Driver Status:** Present, Injured, Transported, Deceased, Fled, Unknown.
*   **Insurance Info:** Company, Policy Number, Expiry Date, Image of Insurance Card / Vehicle Card.

### Phase 5: People (Drivers, Passengers, Pedestrians, Injured, Deceased)
*   *Prompt for total counts first (Drivers, Passengers, Pedestrians, Injured, Deceased), then generate a Card for each person.*
*   **Person Details:**
    *   Role (Driver, Passenger, Pedestrian, Motorcyclist, Cyclist, Officer/EMS).
    *   Gender.
    *   Age (or approximate range).
    *   Injury Status (Uninjured, Minor, Severe, Critical, Dead at Scene, Dead in Transit, Unknown).
*   *Note: Total injured/deceased counts should auto-calculate from the individual person cards.*

### Phase 6: Environmental Conditions and Road Status
*   **Weather:** Clear, Cloudy, Rainy, Foggy, Dust Storm, Severe Wind, Other.
*   **Lighting:** Day, Sunrise, Sunset, Night (Adequate Lighting), Night (Inadequate Lighting).
*   **Road Surface:** Dry, Wet, Damp, Flooded, Icy/Slippery, Contaminated (Oil/Debris), Dirt/Gravel, Unknown.
*   **Geometric Status:** Straight, Horizontal Curve, Incline/Decline, Vertical Curve, Bridge, Tunnel, Ramp, Intersection, Roadworks, Shoulder.
*   **Potential Road Defects:** *(Officer records observations, not definitive legal causes)*: Potholes, Faded Markings, Missing/Damaged Signs, Lighting Failure, Guardrail Defect, Missing Reflectors, Obstacle in Right-of-Way, Flooding, Limited Visibility, No Defect Observed.

### Phase 7: Damage to Freeway Facilities
*   **Question:** "Was there any damage to freeway facilities/assets in this accident?"
*   **If Yes, generate a Card for each damaged asset:**
    *   **Asset Group:** Guardrail, Jersey Barrier, Traffic Sign, Sign Base, Lighting Pole, Lighting Fixture, Fence, Traffic Camera, Toll Equipment, Culvert/Bridge, Other.
    *   Asset ID (If available).
    *   Damage Type & Severity.
    *   Quantity & Unit (Number, Meters, Square Meters, Device, Branch).
    *   Creates immediate hazard? (Yes/No).
    *   Needs repair/compensation? (Yes/No).
    *   Temporary actions taken?
    *   Images of the damage.
*   *Note: This data feeds directly into the insurance and infrastructure damage claim files.*
