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
2. After OAuth, the browser returns to `/studio#api_key=...`.
3. **Expected:** green dot appears, "Pollinations connected" is shown, and the key hash is immediately removed from the address bar.
4. Click **Disconnect**.
5. **Expected:** key cleared from localStorage, auth panel reverts to "Connect Pollinations".

## Scenario 3: Empty / error states
1. Submit brief with empty title and angle.
2. **Expected:** client-side validation error before API call.
3. Submit with real key but no network / server down.
4. **Expected:** error banner with descriptive message, skeleton hidden.

## Scenario 4: Image model switching
1. Proceed to Step 3 (Direction) and open the **Image model** dropdown.
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

## Scenario 7: Image fallback + placeholder
1. Generate concepts with a model that may be unavailable.
2. If an image fails to load, the fallback chain tries alternative models.
3. If all fallbacks fail, the fallback card shows "Retry image" and "Generate placeholder" buttons.
4. Click **Retry image** → retry with fresh seed.
5. Click **Generate placeholder** → a styled SVG placeholder appears showing concept name, text overlay, and face expression.
6. **Expected:** placeholder is visually consistent with the app's dark theme and concept colors.

## Scenario 8: Generation timeout
1. Submit a brief with a real key.
2. If the Pollinations text API takes longer than 30s, the request aborts.
3. **Expected:** user sees a clear "timed out" error message, not a hanging spinner.
4. User can retry immediately.

## Scenario 9: Markdown export
1. Generate concepts.
2. Click **Export Markdown**.
3. **Expected:** a `.md` file downloads containing a structured markdown packet with brief metadata, all 6 concepts (with headings, face expressions, text overlay, color psychology, A/B hint, platform notes, and image prompt in a code block), plus the A/B test plan.
4. Star 2 concepts.
5. Click **Export starred Markdown**.
6. **Expected:** a smaller `.md` file downloads containing only the starred concepts and A/B plan.

## Scenario 10: Text mode and style
1. Open the app and start a brief.
2. On Step 3 (Direction), find **Thumbnail text**.
3. Select **Post-process** and **AI recommended**.
4. **Expected:** the resolved style matches the selected tone and previews show exact UI-rendered lettering.
5. Select **6** concepts and click **Generate 6 Concepts**.
6. Select **Generate in image** with **Banner**, then regenerate.
7. **Expected:** image prompts include the exact phrase and banner style; cards show an Experimental tag and no duplicate UI overlay.
8. Select **No text** and regenerate.
9. **Expected:** concepts use empty text, placement `none`, and text-free image prompts. Cards show a No text tag.

## Scenario 11: Concept count + malformed JSON recovery
1. On Step 3 (Direction), select each count: **3**, **4**, **6**, and **8**.
2. Generate after each selection.
3. **Expected:** the button label and results count match the selected value exactly.
4. With a live key, force or encounter a model response wrapped in prose or followed by commentary.
5. **Expected:** balanced JSON is extracted and generation succeeds.
6. If the first response is truncated or malformed, **Expected:** the server retries once with shorter image prompts.
7. If both attempts are incomplete, **Expected:** show a concise recovery message suggesting retry, fewer concepts, or another model.

## Scenario 12: Wizard draft persistence
1. Open the app, type a video title and angle.
2. Advance to Step 2, fill in audience and category.
3. Refresh the browser.
4. **Expected:** form fields are restored to the values you entered, and the wizard returns to Step 2.
5. Click **Start fresh** on Step 1.
6. **Expected:** step resets to 1, brief is empty, results are cleared.

## Scenario 13: Shortlist persistence + density toggle
1. Generate concepts.
2. Star 2 concepts.
3. Refresh the browser.
4. **Expected:** both stars are still on after reload (shortlist persisted).
5. Click **Compact** in the results toolbar.
6. **Expected:** grid switches to a tighter layout, prompt details collapse.
7. Refresh.
8. **Expected:** Compact view is still selected.

## Scenario 14: History management
1. Generate with 2 different briefs.
2. Click **History ▾**.
3. **Expected:** 2 entries shown with date + title.
4. Click the × on one entry.
5. **Expected:** entry removed, dropdown stays open.
6. Add another brief so there are 2 entries.
7. Click **Clear all history**.
8. **Expected:** confirm prompt appears; on confirm, history is empty.
