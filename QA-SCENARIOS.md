# ThumbSnare QA Scenarios

## Scenario 1: Mock mode end-to-end
1. Ensure `.env.local` has `POLLINATIONS_ALLOW_MOCK=true` and no real key in localStorage.
2. Load the app root.
3. Click **Load example ▾** → select a sample brief (e.g., "Marketing").
4. Click **Generate 6 Concepts**.
5. **Expected:**
   - 6 skeleton cards shown briefly.
   - 6 concept cards appear with consistent structure.
   - Each card has: concept number, concept name, face expression tag, text overlay, color swatch, A/B variant, platform notes, collapsible image prompt.
   - A/B Plan shown in results header.
   - Brief saved to History dropdown.
6. **Validation:**
   - Star one concept → shortlist bar appears with "Copy starred" and "Export starred JSON".
   - Click **Copy starred** → clipboard contains starred concept(s).
   - Click **Export starred JSON** → valid JSON download.
   - Click **Print** → print view hides controls, shows clean layout.
   - Click **Export JSON** → all 6 concepts downloaded.
   - Click **Copy All** → clipboard has all 6.
   - Click **Regenerate** on one concept → concept replaced with new one.

## Scenario 2: BYOP connect + disconnect
1. Click **Connect Pollinations** → redirects to `auth.pollinations.ai`.
2. After OAuth redirect, URL hash contains `api_key=...`.
3. **Expected:** green dot appears, "Pollinations connected" shown.
4. Click **Disconnect**.
5. **Expected:** key cleared from localStorage, auth panel reverts to "Connect Pollinations".

## Scenario 3: Empty / error states
1. Submit brief with empty title and angle.
2. **Expected:** client-side validation error before API call.
3. Submit with real key but no network / server down.
4. **Expected:** error banner with descriptive message, skeleton hidden.

## Scenario 4: Image model switching
1. Open Image model dropdown.
2. Select a different model (e.g., `kontext` instead of `flux`).
3. Click **Generate**.
4. **Expected:** image URLs include `model=kontext` param.
5. Refresh page.
6. **Expected:** previously selected model restored from localStorage.

## Scenario 5: Brief history persistence
1. Generate with any brief.
2. Click **History ▾**.
3. **Expected:** brief listed with title + date.
4. Click history item.
5. **Expected:** form populated with saved brief, result cleared.

## Scenario 6: Per-concept copy
1. Generate concepts.
2. Click **Copy** on one concept.
3. **Expected:** clipboard contains full concept details.
