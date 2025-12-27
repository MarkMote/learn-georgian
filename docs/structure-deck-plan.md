# /structure Deck Implementation Plan

## Goal

Create a new deck route `/structure` for learning Georgian semantic frames through example sentences. This deck teaches how to construct sentences by learning common grammatical patterns (frames) with 15 example sentences each.

---

## Data Sources

### `frames.csv`
| Column | Description |
|--------|-------------|
| `frame_id` | Unique identifier (e.g., `identity_state`, `motion_away_present`) |
| `stage_id` | Learning stage grouping |
| `frame_name` | Human-readable name (e.g., "The Identity Scene") |
| `slot_map` | Grammar pattern (e.g., `[Subject] + [Noun/Adj] + [Verb]`) |
| `usage_summary` | Brief description of when to use this frame |
| `deep_grammar` | Detailed grammatical explanation |

### `frame_examples.csv`
| Column | Description |
|--------|-------------|
| `example_id` | Unique identifier (e.g., `101`, `102`) |
| `frame_id` | Links to frames.csv |
| `english` | English sentence (flashcard front - main content) |
| `georgian` | Georgian sentence (flashcard back - main content) |
| `context` | Situational context (flashcard front - subtle text) |
| `usage_tip` | Learning tip (flashcard back - optional) |

---

## Module Structure

8 modules, each containing 3-5 related frames:

| Module | Name | Frames |
|--------|------|--------|
| 1 | States & Identity | `identity_state`, `location_state`, `origin_state`, `passive_state_result` |
| 2 | Motion & Direction | `motion_away_present`, `motion_toward_present`, `irregular_future_motion`, `motion_advanced_directional` |
| 3 | Doing Things | `doing_present`, `activity_present`, `taking_getting`, `process_start_finish` |
| 4 | Interaction & Exchange | `communication_interaction_present`, `objective_version_present`, `commerce_transaction_present`, `selection_order` |
| 5 | Experience & Feelings | `emotion_experiencer_present`, `physical_sensations`, `desire_present`, `liking_present` |
| 6 | Mind & Ability | `perception_experiencer_present`, `knowledge_present`, `ability_present`, `preference_present` |
| 7 | Possession & Relationships | `possession_inanimate`, `possession_animate`, `ownership_belonging`, `expectation_waiting` |
| 8 | Intent, Rules & Outcomes | `plans_intent`, `obligation_must`, `permission_possibility`, `evidential_perfect` |

Each frame has ~15 examples = ~45-75 flashcards per module.

---

## Route Structure

```
app/structure/
├── page.tsx              # Main page: module buttons + frame descriptions
├── layout.tsx            # SEO metadata
├── [moduleId]/
│   ├── page.tsx          # Flashcard deck view
│   ├── types.ts          # FrameData, FrameExampleData types
│   ├── components/
│   │   ├── FlashCard.tsx        # Front/back card display
│   │   ├── TopBar.tsx           # Progress, settings
│   │   ├── ProgressModal.tsx    # Detailed progress view
│   │   └── FrameExplainerModal.tsx  # Shows frame info from frames.csv
│   ├── hooks/
│   │   └── useStructureState.ts # SRS state management
│   └── utils/
│       └── dataProcessing.ts    # CSV parsing, module filtering
└── practice/
    ├── page.tsx          # Review due cards across all modules
    └── hooks/
        └── useStructurePracticeState.ts
```

---

## Flashcard Design

### Front
- **Main**: English sentence (`english` from frame_examples.csv)
- **Subtle**: Context (`context` from frame_examples.csv)

### Back
- **Main**: Georgian sentence (`georgian` from frame_examples.csv)
- **Secondary**: English sentence (repeated for reference)
- **Optional**: Slot map (`slot_map` from frames.csv)
- **Optional**: Usage tip (`usage_tip` from frame_examples.csv)
- **Button**: "Explain this frame" (top-right) → opens modal with:
  - Frame name (`frame_name`)
  - Usage summary (`usage_summary`)
  - Deep grammar explanation (`deep_grammar`)

---

## Main Page Design (`/structure/page.tsx`)

### Top Section
- Title: "Sentence Structure" (or similar)
- Description: Brief intro to semantic frames
- Module buttons in a grid (like /chunks and /review)
  - Each button shows module name + progress (e.g., "45/60 learned")

### Bottom Section
- Frame reference: List all frames with:
  - Frame name
  - Usage summary
  - 1-2 example sentences (from frame_examples.csv)
- Collapsible or scrollable for easier navigation

---

## Types

```typescript
// types.ts

export type FrameData = {
  frame_id: string;
  stage_id: string;
  frame_name: string;
  slot_map: string;
  usage_summary: string;
  deep_grammar: string;
};

export type FrameExampleData = {
  example_id: string;
  frame_id: string;
  english: string;
  georgian: string;
  context: string;
  usage_tip: string;
};

export type ReviewMode = "normal" | "reverse";
export type DifficultyRating = "easy" | "good" | "hard" | "fail";

export interface KnownExampleState {
  data: FrameExampleData;
  frame: FrameData;  // Link to parent frame for "explain" modal
  rating: number;
  lastSeen: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
}
```

---

## Module Configuration

```typescript
// utils/modules.ts

export const MODULES = [
  {
    id: 1,
    name: "States & Identity",
    description: "What things are and where they are.",
    frames: ["identity_state", "location_state", "origin_state", "passive_state_result"]
  },
  {
    id: 2,
    name: "Motion & Direction",
    description: "How people and things move in space.",
    frames: ["motion_away_present", "motion_toward_present", "irregular_future_motion", "motion_advanced_directional"]
  },
  {
    id: 3,
    name: "Doing Things",
    description: "Actions you actively perform.",
    frames: ["doing_present", "activity_present", "taking_getting", "process_start_finish"]
  },
  {
    id: 4,
    name: "Interaction & Exchange",
    description: "Doing things with or for others.",
    frames: ["communication_interaction_present", "objective_version_present", "commerce_transaction_present", "selection_order"]
  },
  {
    id: 5,
    name: "Experience & Feelings",
    description: "Things that happen to you internally.",
    frames: ["emotion_experiencer_present", "physical_sensations", "desire_present", "liking_present"]
  },
  {
    id: 6,
    name: "Mind & Ability",
    description: "What you know, understand, or are able to do.",
    frames: ["perception_experiencer_present", "knowledge_present", "ability_present", "preference_present"]
  },
  {
    id: 7,
    name: "Possession & Relationships",
    description: "How things and people relate to you.",
    frames: ["possession_inanimate", "possession_animate", "ownership_belonging", "expectation_waiting"]
  },
  {
    id: 8,
    name: "Intent, Rules & Outcomes",
    description: "Plans, obligations, permissions, and results.",
    frames: ["plans_intent", "obligation_must", "permission_possibility", "evidential_perfect"]
  }
];
```

---

## SRS / Storage

Same pattern as `/chunks`:
- Storage key: `srs_structure_v3_{moduleId}_{mode}`
- Uses existing `lib/spacedRepetition/` functions
- No new algorithm logic needed

---

## Decisions

- **"Explain this frame" button**: Back only
- **"View All Examples" page**: Not needed for v1 (can add later)
- **Progress tracking**: Per-example (each flashcard is tracked individually)

---

## Implementation Plan

### Phase 1: Foundation

**Step 1.1: Create directory structure**
```
app/structure/
├── page.tsx
├── layout.tsx
└── [moduleId]/
    ├── page.tsx
    ├── types.ts
    ├── components/
    ├── hooks/
    └── utils/
```

**Step 1.2: Define types** (`[moduleId]/types.ts`)
- `FrameData` - shape matching frames.csv
- `FrameExampleData` - shape matching frame_examples.csv
- `ReviewMode`, `DifficultyRating` - same as chunks
- `KnownExampleState` - for SRS tracking

**Step 1.3: Create module configuration** (`[moduleId]/utils/modules.ts`)
- Export `MODULES` array with id, name, description, frame_ids
- Helper function `getModuleById(id: number)`

---

### Phase 2: Data Layer

**Step 2.1: CSV parsing utilities** (`[moduleId]/utils/dataProcessing.ts`)
- `parseFramesCSV(csvText: string): FrameData[]`
- `parseExamplesCSV(csvText: string): FrameExampleData[]`
- `getExamplesForModule(examples: FrameExampleData[], moduleId: number): FrameExampleData[]`
  - Uses MODULES config to filter by frame_ids
- `getFrameById(frames: FrameData[], frameId: string): FrameData | undefined`
- `getModuleProgress(...)` - count seen/known for progress display
- `computePercentageScore(...)` - for progress bar

**Step 2.2: Data loading pattern**
- Fetch both CSVs on page load
- Filter examples by module
- Enrich each example with its parent frame data

---

### Phase 3: Main Page (`/structure/page.tsx`)

**Step 3.1: Create layout.tsx**
- SEO metadata (title, description, OpenGraph)

**Step 3.2: Build main page structure**
- Header with back link (same pattern as /chunks)
- Title: "Sentence Structure"
- Description paragraph

**Step 3.3: Module grid**
- Fetch both CSVs
- Calculate progress for each module from localStorage
- Render 8 module buttons in grid
  - Module name
  - Module description (subtle)
  - Progress indicator (e.g., "32/60 learned")

**Step 3.4: Bottom actions**
- "Review Due" button (if any cards are due)
- "Practice All" button (when caught up)

**Step 3.5: Frame reference section** (below module grid)
- List all 8 modules as collapsible sections
- Each section shows its frames with:
  - Frame name
  - Usage summary
  - 1-2 example sentences

---

### Phase 4: Deck Page (`/structure/[moduleId]/page.tsx`)

**Step 4.1: Create page skeleton**
- Get moduleId from params
- Get mode from searchParams
- Loading states (same pattern as chunks)

**Step 4.2: Data fetching**
- Fetch frames.csv and frame_examples.csv
- Filter examples for this module
- Build lookup map of frames by frame_id

**Step 4.3: Wire up components**
- TopBar (progress, settings menu)
- FlashCard (centered)
- BottomBar (shared component - rating buttons)

**Step 4.4: Keyboard shortcuts**
- Space = flip
- q/w/e/r = fail/hard/good/easy
- m = cycle mode (normal/reverse)

---

### Phase 5: FlashCard Component

**Step 5.1: Create FlashCard.tsx**
- Props: example, frame, isFlipped, reviewMode, onExplainClick

**Step 5.2: Front face**
- Main: English sentence (large, centered)
- Subtle: Context (smaller, gray text below)

**Step 5.3: Back face**
- Main: Georgian sentence (large, Noto Sans Georgian font)
- Secondary: English sentence (medium, for reference)
- Optional: Slot map (if exists, styled as code/pattern)
- Optional: Usage tip (if exists, styled as hint)
- "Explain" button (top-right corner)

**Step 5.4: Flip animation**
- Same card flip animation as chunks/review

---

### Phase 6: Frame Explainer Modal

**Step 6.1: Create FrameExplainerModal.tsx**
- Props: isOpen, onClose, frame (FrameData)

**Step 6.2: Modal content**
- Frame name (title)
- Slot map (styled as pattern)
- Usage summary (paragraph)
- Deep grammar explanation (longer text, possibly with **bold** for terms)

**Step 6.3: Styling**
- Dark modal matching app theme
- Scrollable if content is long
- Close button (X) and click-outside-to-close

---

### Phase 7: SRS State Management

**Step 7.1: Create useStructureState.ts**
- Adapt from useChunkState.ts
- Storage key: `srs_structure_v3_{moduleId}_{mode}`

**Step 7.2: Key adaptations**
- `exampleToWordData()` - convert FrameExampleData to WordData format for SRS lib
- Use example_id as the card key
- Track frame reference alongside each card

**Step 7.3: Expose same interface**
- `knownExamples`, `currentIndex`, `cognitiveLoad`
- `handleScore(difficulty)`, `clearProgress()`
- `isFlipped`, `setIsFlipped`

---

### Phase 8: TopBar & ProgressModal

**Step 8.1: Create TopBar.tsx**
- Back button (to /structure)
- Progress indicator (X/Y learned)
- Settings dropdown:
  - Clear progress
  - Mode selector (normal/reverse)

**Step 8.2: Create ProgressModal.tsx**
- List all examples in module
- Show status for each (new/learning/graduated)
- Current card highlighted

---

### Phase 9: Practice Mode

**Step 9.1: Create practice/page.tsx**
- Aggregates due cards across all 8 modules
- Same UI as deck page but pulls from all localStorage keys

**Step 9.2: Create useStructurePracticeState.ts**
- Scan all `srs_structure_v3_*` keys
- Collect cards that are due
- Present in SRS order

---

### Phase 10: Polish & Integration

**Step 10.1: Add /structure link to home page**
- New card/button on main landing page

**Step 10.2: Testing**
- Verify CSV parsing with actual data
- Test SRS flow (new cards, scoring, due dates)
- Test practice mode aggregation

**Step 10.3: Style consistency**
- Match existing app theme
- Georgian font rendering
- Mobile responsiveness

---

## File Creation Order

1. `app/structure/layout.tsx`
2. `app/structure/[moduleId]/types.ts`
3. `app/structure/[moduleId]/utils/modules.ts`
4. `app/structure/[moduleId]/utils/dataProcessing.ts`
5. `app/structure/page.tsx` (basic version)
6. `app/structure/[moduleId]/hooks/useStructureState.ts`
7. `app/structure/[moduleId]/components/FlashCard.tsx`
8. `app/structure/[moduleId]/components/FrameExplainerModal.tsx`
9. `app/structure/[moduleId]/components/TopBar.tsx`
10. `app/structure/[moduleId]/components/ProgressModal.tsx`
11. `app/structure/[moduleId]/page.tsx`
12. `app/structure/page.tsx` (full version with frame reference)
13. `app/structure/practice/hooks/useStructurePracticeState.ts`
14. `app/structure/practice/page.tsx`

---

## Notes

- This follows the same structural pattern as `/chunks` and `/review`
- Shared components: `BottomBar`, `useFlashcardLock`
- Frame data is enriched onto each flashcard so the "explain" modal has context
- No new SRS algorithm needed - reuses `lib/spacedRepetition/`
