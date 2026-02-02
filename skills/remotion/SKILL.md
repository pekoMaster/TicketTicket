---
name: Remotion Video Generation
description: Guidelines and best practices for creating programmatic videos using Remotion in Next.js.
---

# Remotion Video Generation Skill

This skill provides guidelines for creating programmatic videos using [Remotion](https://www.remotion.dev/) within a Next.js application.

## Prerequisites

Ensure the following packages are installed:
- `remotion`
- `@remotion/react`
- `@remotion/player` (for embedding players)
- `@remotion/zod` (for schema validation)
- `@remotion/tailwind` (optional, for styling)
- `@remotion/shapes` (optional, for geometric shapes)

## Directory Structure

Keep video logic separate from the main application code:

```
src/
  video/
    Root.tsx          # Entry point (register compositions here)
    compositions/     # Folder for each video composition
      MyVideo/
        index.tsx     # Composition component
        Sequence.tsx  # Main sequence
    components/       # Reusable video components (Abstract UI, etc.)
    utils/            # Helper functions
remotion.config.ts    # Remotion configuration
```

## Best Practices

### 1. Composition Registration
Register your compositions in `src/video/Root.tsx` using `<Composition />`.

```tsx
import { Composition } from 'remotion';
import { MyVideo } from './compositions/MyVideo';
import { myVideoSchema } from './compositions/MyVideo/schema';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={30 * 60} // 60 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
        schema={myVideoSchema}
        defaultProps={{
           title: 'Hello World' 
        }}
      />
    </>
  );
};
```

### 2. Randomness & Data
- **Do NOT** use `Math.random()` directly. Use `random()` from `remotion` with a seed to ensure deterministic rendering.
- For data fetching, use `calculateMetadata` or pass props securely.

### 3. Styling
- Use Tailwind CSS via the `className` prop.
- Ensure `remotion.config.ts` is configured to process Tailwind if using it.

### 4. Layout & Animation
- Use `AbsoluteFill` to cover the entire canvas.
- Use `useCurrentFrame()` and `interpolate()` for animations.
- Use `spring()` for natural motion.
- Use `Sequence` to organize scenes in time.

```tsx
const frame = useCurrentFrame();
const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
```

## Abstract UI Style Guide
When creating "Abstract UI" videos:
- Use simple shapes (Rounded Rectangles) for windows/cards.
- Use lines (`<div className="h-2 w-full bg-gray-200 rounded" />`) for text skeleton.
- Use distinct colors (Brand Primary) for interaction points (Buttons).
- Focus on flow and transition rather than pixel-perfect text readability.
