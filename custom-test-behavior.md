# Custom Route Spaced Repetition - Expected Behavior

## Initial State
- **Score starts at**: 0% (all cards have easinessFactor = 2.0, which is < 2.5 threshold)
- **Cards shown**: In sequence (round-robin: 0, 1, 2, 3, 0, 1, 2, 3...)
- **All cards**: Start with easinessFactor=2.0, interval=1, repetitions=0

## Scoring Effects

### After pressing "Fail" (q)
- **easinessFactor**: Decreases by 0.2 (but minimum 1.3)
- **repetitions**: Reset to 0
- **interval**: Reset to 1
- **Effect on score**: Card stays below 2.5 threshold = still counts as "struggling"

### After pressing "Hard" (w)  
- **easinessFactor**: Decreases by 0.15 (but minimum 1.3)
- **repetitions**: +1
- **interval**: Increases by (interval * easinessFactor)
- **Effect on score**: Usually still below 2.5 = counts as "struggling"

### After pressing "Good" (e)
- **easinessFactor**: Increases by 0.1
- **repetitions**: +1  
- **interval**: Increases by (interval * easinessFactor)
- **Effect on score**: After 2-3 "good" ratings, should reach >= 2.5 = "mastered"

### After pressing "Easy" (r)
- **easinessFactor**: Increases by 0.2
- **repetitions**: +1
- **interval**: Increases by (interval * easinessFactor * 1.3)
- **Effect on score**: Should quickly reach >= 2.5 = "mastered"

## Expected Score Progression

Starting with 10 cards:
1. **Initial**: 0% (0/10 cards >= 2.5)
2. **After 5 "good" ratings**: ~50% (5/10 cards >= 2.5)  
3. **After 10 "good" ratings**: 100% (10/10 cards >= 2.5)

## Card Progression
- Always moves to next card in sequence: `(currentIndex + 1) % totalCards`
- No smart selection - just round-robin through all cards
- User can manually navigate with keyboard or buttons

This behavior should now work correctly with the updated adapter!