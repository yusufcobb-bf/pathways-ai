# Visual Story Foundations (Stage 5)

> **One beat = One image = One observable moment**

This document defines the conventions for visual metadata in story beats, enabling illustrator-ready content before actual artwork exists.

## Purpose

Visual metadata makes every beat "illustrator-ready" by specifying:
- What to show (location, actors, props)
- How to frame it (shot type)
- What emotion to convey (mood)
- A concrete prompt for image generation

## Required Fields

Every beat in a visual beat story MUST have these fields:

| Field | Type | Description |
|-------|------|-------------|
| `shot` | `"wide" \| "medium" \| "close-up" \| "over-shoulder" \| "top-down"` | Camera framing |
| `mood` | `string` | Emotional tone (e.g., "tense", "hopeful", "aggressive") |
| `illustrationPrompt` | `string` | Concrete, drawable scene description |
| `illustrationKey` | `string` | Unique key: `arraadia:{section}:{beat.id}` |

## Conditional Fields

| Field | Type | When to Include |
|-------|------|-----------------|
| `location` | `string` | Required for environment/transition beats; recommended elsewhere |
| `props` | `string[]` | When key objects should be visible in the scene |

## Shot Type Guidelines

| Shot | Use For | Example |
|------|---------|---------|
| `wide` | Environment, transitions, group scenes | Establishing shots, battle overviews |
| `medium` | Dialogue, character actions | Two characters talking, someone walking |
| `close-up` | Emotions, objects, reactions | Character's fearful face, sword on table |
| `over-shoulder` | Conversations, POV | Looking at someone from behind another |
| `top-down` | Maps, tactical views | Battle formations, village layout |

## illustrationKey Format

**Strictly:** `arraadia:{section}:{beat.id}`

Section examples:
- `intro` - Introduction beats
- `c1`, `c2`, `c3`, `c4`, `c5` - Checkpoint beats
- `c1-a`, `c1-b`, `c1-c` - Branch beats for choice A/B/C
- `c3-crops`, `c3-weapons`, `c3-walls` - Auto-branch outcomes
- `tactical:intro`, `tactical:tac-archers` - Tactical loop beats
- `ending` - Ending beats

## illustrationPrompt Guidelines

**DO:**
- Describe ONE drawable moment
- Be concrete and specific
- Focus on what's visible

**DON'T:**
- Combine multiple actions
- Include dialogue text
- Describe emotions abstractly

## Example Beats

### Environment Wide Shot

```json
{
  "id": "intro-1",
  "text": "Once upon a time, in the ancient world of Arraadia...",
  "focus": "environment",
  "casel": ["social-awareness"],
  "shot": "wide",
  "mood": "epic",
  "location": "Arraadia - overview",
  "illustrationPrompt": "Vast fantasy continent with diverse nations, viewed from above",
  "illustrationKey": "arraadia:intro:intro-1"
}
```

### Dialogue Close-up

```json
{
  "id": "c1-a-1",
  "text": "\"No more! You've taken enough from these people!\" shouts Mono.",
  "actor": "Mono",
  "focus": "dialogue",
  "casel": ["self-management", "responsible-decision-making"],
  "shot": "medium",
  "mood": "aggressive",
  "location": "Thumur village square",
  "illustrationPrompt": "Mono speaking, facing forward with determined expression",
  "illustrationKey": "arraadia:c1-a:c1-a-1"
}
```

### Action Beat

```json
{
  "id": "tac-archers-1",
  "text": "Arrows rain down on the advancing soldiers.",
  "focus": "observation",
  "casel": ["responsible-decision-making"],
  "shot": "wide",
  "mood": "intense",
  "location": "Thumur battlefield",
  "props": ["arrows", "armor"],
  "illustrationPrompt": "Arrows raining down on armored soldiers, shields raised",
  "illustrationKey": "arraadia:tactical:tac-archers:tac-archers-1"
}
```

## Writer/Artist Guidelines

1. **One Moment Rule**: Each beat should capture a single, freeze-frame moment
2. **No Compound Actions**: Don't write "Mono runs and then jumps" — pick one
3. **Concrete Over Abstract**: "Fearful expression" not "feeling afraid"
4. **Props Matter**: If an object is mentioned in text, consider adding to props
5. **Location Consistency**: Track where scenes take place for continuity

## Placeholder Card (Pre-Art)

When no image exists, StoryPage displays a subtle placeholder card showing:
- Location
- Shot type
- Mood
- Actor (if present)
- Props (if present)

This helps writers and artists visualize the intended composition before real art is created.
