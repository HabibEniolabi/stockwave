# StockWave Architecture & Under-the-Hood Study Guide

> A two-day path to understanding the app well enough to continue building it yourself.

## Goal
At the end of two days, you should be able to explain the app startup sequence, trace every authentication/onboarding/security flow, know which layer owns each responsibility, debug a broken flow without guessing, and add a new feature without depending on generated code.

## 1. One-page mental model

```text
USER INTERACTION
      ↓
Expo Router Screen
      ↓
AppSessionContext / screen-local state
      ↓
Service function
      ↓
Device APIs OR Supabase/Edge Functions
      ↓
state changes
      ↓
route guard + React re-render
      ↓
next screen
```

**Core rule:** state is the source of truth; navigation reacts to state.

## 2. Architecture layers
- `src/app`: routes/screens only.
- `context/AppSessionContext.tsx`: cross-screen orchestration.
- `services/auth.ts`: authentication/backend calls.
- `services/deviceSecurity.ts`: PIN/biometric persistence.
- `lib/supabase.ts` + `config/env.ts`: Supabase client/environment.
- Supabase tables/RPC: durable server state.
- Supabase Edge Functions: privileged server operations.
- Expo Router layouts: navigation structure/guards.

## 3. Navigation decision tree
```text
not ready → render nothing
no session → Sign In
phone missing → PhoneNumberScreen
verification incomplete → OtpVerificationScreen
welcome incomplete → WelcomeScreen
PIN exists + app locked → UnlockPinScreen
otherwise → Tabs/Home
```

Readiness flags matter because `false` can mean “not present” or “not loaded yet”.

## 4. AppSessionContext mental model
Four categories of state:
1. Supabase session: `session`, `user`, `isAuthenticated`, `isSessionReady`.
2. Onboarding: `hasRegistrationPhone`, `hasCompletedVerification`, `hasSeenWelcome`.
3. Device security: `pinCreated`, `biometricEnabled`, `isAppUnlocked`, `isDeviceSecurityReady`.
4. Recovery: email, challenge token, reset token, expiry, verified state.

## 5. Remote auth vs local lock
```text
Supabase session exists?         isAppUnlocked?
       ↓                               ↓
remote identity                  local app access
```
Do not treat the PIN as the Supabase password.

## 6. Cold start
1. Provider mounts.
2. `supabase.auth.getSession()` restores the remote session.
3. `onAuthStateChange` subscribes to future auth changes.
4. Verification state restores.
5. Device security restores for `user.id`.
6. `isAppUnlocked` starts false on a cold start.
7. Route guard decides only after readiness flags are true.

## 7. Registration/onboarding
```text
Walkthrough → Sign Up → Supabase session → Phone → in-app verification → Welcome → Home → biometric/PIN setup
```

## 8. PIN/biometrics
- Sensitive local secret → SecureStore.
- Non-secret preference → AsyncStorage.
- `isAppUnlocked` → memory only.
- Normal sign-out preserves persisted PIN.
- Full reset/account deletion clears device security.
- App backgrounding should locally lock after a grace period, not log the user out.

## 9. Password recovery
```text
Forgot Password
→ Edge Function start
→ challengeToken + code + expiry
→ verify challenge
→ short-lived resetToken
→ create new password
→ Edge Function admin password update
```
Never ship a service-role/secret key in Expo.

> Security caveat: an OTP displayed by the same app that requested it is not production-grade proof of email ownership.

## 10. React concepts to master
- `useState`: runtime/local mutable state.
- `useEffect`: synchronize with external systems; understand dependencies and cleanup.
- `useRef`: persistent mutable value without rendering.
- `useContext`: subscribe to provider state.
- derived state: calculate from source when possible.
- async restoration/readiness.
- cleanup and stale closures.

## 11. Debugging process
1. Write expected vs actual flow.
2. Identify owning layer.
3. Log a state snapshot.
4. Follow one function boundary deeper.
5. Read server response/logs rather than wrapper errors.
6. Look for async restoration races.
7. Remove duplicate owners of session/navigation state.

## 12. Two-day plan
### Day 1
- 60m: workspace + routes + Nx graph.
- 45m: Expo Router + Context videos.
- 90m: AppSessionContext state mapping.
- 60m: useContext/useEffect videos and effect annotation.
- 90m: trace cold start, signup, signin, PIN, signout.
- 30m: rebuild a tiny protected Context app.

### Day 2
- 60m: Supabase auth/session + services.
- 60m: SecureStore/LocalAuthentication/AppState.
- 60m: Edge Functions videos + server functions.
- 75m: password recovery + deletion traces.
- 90m: build one Home feature without generated code.
- 45m: final self-test.

## 13. Videos
1. notJust.dev — React Native Full 8 Hours Course (Expo, Expo Router, Supabase): https://www.youtube.com/watch?v=rIYzLhkG9TA  
   Target: 54:25 Router, 1:40:31 Context, 3:35:14 Supabase setup, 3:45:47 sessions, 3:58:52 auth, 6:19:00 logout.
2. Web Dev Simplified — Learn useContext in 13 Minutes: https://www.youtube.com/watch?v=5LrDIWkK_Bc
3. Web Dev Simplified — Learn useEffect in 13 Minutes: https://www.youtube.com/watch?v=0ZJgIjIuY7U
4. Supabase — Edge Functions Explained: https://www.youtube.com/watch?v=za_loEtS4gs
5. Supabase — Edge Functions Quickstart: https://www.youtube.com/watch?v=5OWH9c4u68M
6. Optional notJust.dev full-stack mobile app: https://www.youtube.com/watch?v=l9ov48v0M2M

## 14. Official docs
- Expo Router core concepts: https://docs.expo.dev/router/basics/core-concepts/
- Expo Router navigation layouts: https://docs.expo.dev/router/basics/navigation-layouts/
- Expo Router authentication: https://docs.expo.dev/router/advanced/authentication/
- React useContext: https://react.dev/reference/react/useContext
- React useEffect: https://react.dev/reference/react/useEffect
- React Native AppState: https://reactnative.dev/docs/appstate.html
- Expo SecureStore: https://docs.expo.dev/versions/latest/sdk/securestore/
- Expo LocalAuthentication: https://docs.expo.dev/versions/latest/sdk/local-authentication/
- Supabase Auth: https://supabase.com/docs/reference/javascript/auth
- Supabase sessions: https://supabase.com/docs/guides/auth/sessions
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Nx mental model: https://nx.dev/docs/concepts/mental-model
- Nx workspace/project graph: https://nx.dev/docs/getting-started/tutorials/understanding-your-workspace

## 15. Final self-test
Can you explain without notes:
- Supabase session vs `isAppUnlocked`?
- Why readiness flags exist?
- Why a returning user's PIN can look absent during restoration?
- Normal sign-out vs full reset?
- Route groups/layouts and `replace` vs `push`?
- `onAuthStateChange`?
- SecureStore vs AsyncStorage?
- AppState lock vs logout?
- Why admin secrets never live in Expo?
- Why recovery needs server validation and a reset token?
- End-to-end Delete Account flow?

## Rebuild challenges
- Build a toy Sign In → Private Home → Sign Out app using Expo Router + Context.
- Add a SecureStore PIN and restore it on cold start.
- Add a 15-second AppState lock without logging out.
- Create/invoke a tiny Edge Function from a service layer.
- Then build one real StockWave Home feature without generated code.
