# Creator App Spec
# Creator App Shell - UI & Architecture Specification

## 1. Core Product Philosophy
This is an **Approval-first Delivery Pipeline**, NOT a traditional marketplace. 
- **Goal:** Minimize cognitive load for KOCs (Key Opinion Consumers).
- **Rule 1:** NO text inputs or keyboards. Use tag-based bottom sheets for feedback.
- **Rule 2:** System moves by default. One primary call-to-action per screen.
- **Rule 3:** Ban standard Material Design UI. No default AppBars with drop shadows, no Floating Action Buttons, no default Card widgets. Everything must be custom-styled to feel "Premium, Airy, and Calm".

## 2. Design Tokens (Strictly Enforced)
- **Font:** Use `google_fonts` package. Set global font to **Inter** (or Apple's SF Pro if mimicking native iOS).
- **Colors:**
  - Background: `Color(0xFFF3F4F6)` (Light Gray)
  - Surface/Card: `Colors.white`
  - Primary Text/Button: `Color(0xFF111827)` (Deep Gray/Black)
  - Secondary Text: `Color(0xFF6B7280)`
  - Accent (AI/Magic): `Color(0xFF9333EA)` (Purple)
  - Success (Pre-approved/Paid): `Color(0xFF059669)` (Green)
- **Radii & Shadows:**
  - Extreme rounded corners: Use `BorderRadius.circular(24)` or `32` for core cards and bottom sheets.
  - Premium Shadow: `BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 24, offset: Offset(0, 4))`

## 3. Atomic Widgets to Build First
Before building any screens, create these reusable widgets in `lib/widgets/`:
1. `PremiumCard`: A container with white background, `circular(24)`, and the premium shadow.
2. `PrimaryButton`: A full-width button, background `0xFF111827`, text white `Inter` semi-bold 16pt, `circular(16)`, `height: 56`.
3. `GhostButton`: Text only, gray color, for secondary actions.
4. `StatusBadge`: Small container, e.g., green background (10% opacity) with green text, `circular(6)`, uppercase, letter spacing 1.2.

## 4. State Management & Routing
- Use `GoRouter` for declarative routing.
- Use `Riverpod` (or `Provider`) for simple state management (mocking the flow from "Match" -> "Accepted" -> "Published").

## 5. Required Screens (Phase 1 Shell)
1. **MatchesScreen:** The home feed. Displays a list of `OpportunityCard`s (Pre-approved matches). No traditional AppBars, just a safe area top padding with a sleek title.
2. **TimelineStitchingScreen:** The 80% AI / 20% Creator UI. Shows grayed-out disabled blocks and one highlighted purple block asking the user to "Record 7s clip".
3. **PublishHandoffScreen:** Shows the locked caption (read-only) and a massive "Publish to TikTok" button.
4. **AccountWalletScreen:** Big typography for balance ("$1,250") and a "Cash Out" button.

## 6. Development Prompting Rule
Do NOT hallucinate UI elements outside this spec. Always check this spec before suggesting a new widget. Focus on creating static screens and connecting them via a mock state flow first.
