# VR Login Page - Design Specifications Quick Reference

## Color Reference

### Primary Colors
| Color | Hex | HSL | Usage |
|-------|-----|-----|-------|
| Dark Navy | #0a1f38 | 215 66% 14% | Background top |
| Navy Teal | #0d2a4a | 215 59% 18% | Background middle |
| Deep Blue | #001d3d | 215 100% 12% | Background bottom |

### Accent Colors
| Color | Hex | HSL | Usage |
|-------|-----|-----|-------|
| Cyan Bright | #22d3ee | 187 85% 43% | Primary accent, glows |
| Cyan Light | #cffafe | 187 100% 91% | Text headings (cyan-300) |
| Blue Light | #93c5fd | 217 98% 66% | Supporting text (blue-300) |
| Purple | #8b5cf6 | 263 90% 65% | Secondary accent |

### Transparent Overlays
| Name | Value | Usage |
|------|-------|-------|
| Glass Base | rgba(15, 23, 42, 0.7) | Card background |
| Cyan Glow | rgba(34, 211, 238, 0.1-0.4) | Focus states, glows |
| Purple Glow | rgba(139, 92, 246, 0.1-0.3) | Accent glows |
| Red Error | rgba(239, 68, 68, 0.1) | Error background |

---

## Typography

### Heading (Gradient)
```
Font: Inter, system-ui, sans-serif
Size: 3rem / 2.5rem (mobile)
Weight: Bold (700)
Effect: bg-gradient-to-r from-cyan-300 to-blue-300
Color: Transparent (with gradient)
Letter Spacing: Normal
Line Height: Tight (1.25)
```

### Supporting Text
```
Font: Inter
Size: 1.125rem (lg)
Weight: Normal (400)
Color: text-blue-200/80
Opacity: 80% for secondary importance
```

### Input Labels
```
Font: Inter
Size: 0.875rem (sm)
Weight: Medium (500)
Color: text-cyan-300 (hover: cyan-200)
Transition: 200ms color
```

### Button Text
```
Font: Inter
Size: 1rem (base)
Weight: Semibold (600)
Color: white
Letter Spacing: Normal
Text Shadow: None
```

---

## Component Specifications

### Login Card (Glassmorphism)
```
┌─────────────────────────────────┐
│  Width: max-w-md (448px)        │
│  Background: rgba(15, 23, 42, 0.7) │
│  Backdrop Filter: blur(20px)    │
│  Border: 1px solid rgba(34, 211, 238, 0.1) │
│  Border Radius: 0.5rem (8px)    │
│  Box Shadow:                    │
│    0 8px 32px rgba(34, 211, 238, 0.1) │
│  Padding: Responsive (p-8)      │
│  Gap Between Elements: 1.5rem   │
└─────────────────────────────────┘

Hover Effect:
└─ Glow: rgba(34, 211, 238, 0.2) at ±0.5rem
└─ Opacity: 0 → 100% over 500ms
```

### Input Fields
```
┌──────────────────────────────────┐
│  Height: 2.75rem (44px)          │
│  Border Radius: 0.5rem (8px)     │
│  Background: rgb(30, 58, 138) at 40% opacity │
│  Border: 1px solid rgba(34, 211, 238, 0.3) │
│  Padding: 1rem (right 2.5rem for password) │
│  Font: base, white               │
│  Placeholder: text-blue-300/50   │
│                                  │
│  Focus State:                    │
│  ├─ Border Color: cyan-400       │
│  ├─ Ring: 1px cyan-400/50        │
│  ├─ Background Glow:             │
│  │  rgba(34, 211, 238, 0.2)      │
│  └─ Box Shadow: 0 0 20px rgba(34, 211, 238, 0.15) │
│                                  │
│  Transition: all 200ms           │
└──────────────────────────────────┘
```

### Sign In Button
```
┌──────────────────────────────────┐
│  Width: 100% (w-full)            │
│  Height: 2.75rem (44px)          │
│  Border Radius: 0.5rem (8px)     │
│  Background:                     │
│    gradient(135deg, #22d3ee, #00d9ff) │
│  Text: semibold, white           │
│                                  │
│  Normal State:                   │
│  ├─ Box Shadow: 0 0 10px rgba(34, 211, 238, 0.2) │
│  └─ Opacity: 1                   │
│                                  │
│  Hover State:                    │
│  ├─ Scale: 105% (1.05)           │
│  ├─ Shimmer: Light sweep (2s)    │
│  ├─ Box Shadow: Increased glow   │
│  └─ Transition: 300ms all        │
│                                  │
│  Active State:                   │
│  ├─ Scale: 95% (0.95)            │
│  └─ Transition: 100ms all        │
│                                  │
│  Loading State:                  │
│  ├─ Opacity: 1                   │
│  ├─ Cursor: not-allowed          │
│  └─ Content: Spinner + "Signing in..." │
│                                  │
│  Disabled State:                 │
│  ├─ Opacity: 50%                 │
│  ├─ Cursor: not-allowed          │
│  └─ Scale: 100% (no hover scale) │
└──────────────────────────────────┘
```

### Password Toggle Icon
```
Position: Absolute right (1rem), centered vertically
Size: 1rem (16px)
Color: rgba(34, 211, 238, 0.6)
Hover Color: rgba(34, 211, 238, 0.8)
Transition: 200ms color
Cursor: pointer
```

### Error Message
```
┌──────────────────────────────────┐
│  Background: rgba(239, 68, 68, 0.1) │
│  Border Left: 4px solid rgba(239, 68, 68, 0.5) │
│  Border Radius: 0.5rem (8px)     │
│  Padding: 1rem                   │
│  Text: sm, font-medium, red-300  │
│  Animation: shake 0.5s            │
│  Gap: 1.5rem                      │
└──────────────────────────────────┘
```

### Logo Section
```
┌──────────────────────────────────┐
│  Display: flex, gap-3            │
│  Image Size: 3.5rem (56px)       │
│                                  │
│  Hover Effect:                   │
│  ├─ Image Scale: 110% (1.1)      │
│  ├─ Background: rgba(34, 211, 238, 0.2) │
│  └─ Transition: 300ms all        │
│                                  │
│  Text:                           │
│  ├─ Title: bold, white           │
│  ├─ Subtitle: sm, cyan-300/70    │
│  └─ Letter Spacing: wide (0.1em) │
└──────────────────────────────────┘
```

---

## Animation Timing

### Standard Durations
- **Fast**: 200ms (icon hover, color transitions)
- **Standard**: 300ms (scale effects, focus states)
- **Slow**: 500ms (glow opacity, large transitions)
- **Continuous**: 2-6s (particle movement, grid waves)

### Easing Functions
- **Fade In**: ease-out (quick start, slow end)
- **Glow Pulse**: ease-in-out (smooth both directions)
- **Button Hover**: ease-out (snappy)
- **Particles**: linear (constant speed)

### Stagger Delays
- Card: 0s
- Logo: 0.1s
- Form Inputs: Sequential (0.15s apart optional)
- Security Note: 0.2s

---

## Responsive Breakpoints

### Desktop (lg: 1024px+)
- Left Panel: 50% width (VR visuals)
- Right Panel: 50% width (login form)
- Logo Size: 3.5rem
- Font Scale: 1rem base
- Gap: 2rem

### Tablet (md: 768px - 1023px)
- Full width login form
- Logo at top, visible
- Font Scale: 0.95rem base
- Padding: 2rem

### Mobile (sm: 640px - 767px)
- Full width, single column
- Logo smaller: 2.5rem
- Padding: 1.5rem
- Font Scale: 0.9rem base

### Extra Small (< 640px)
- Padding: 1rem
- Gap Reduced: 1rem
- Font Scale: 0.85rem base

---

## Particle System Specifications

### Particle Properties
```
Count: 40 particles
Movement: 3D space (x, y, z)
Velocity: x: ±0.25, y: ±0.25, z: ±1
Size Range: 1-3px
Opacity Range: 0.3-0.8
Glow Color: rgba(34, 211, 238, x)
Trail Effect: Yes (15% alpha canvas clear)
```

### Particle Animation
```
Update Rate: 60fps (requestAnimationFrame)
Depth Cycling: 0-1000 range
Perspective Scale: z/1000
Edge Wrapping: Yes (continuous loop)
Glow Gradient: Radial (core + halo)
```

### Grid Lines
```
Spacing: 100px
Wave Amplitude: ±10px
Wave Speed: Date.now() * 0.0002
Color: rgba(34, 211, 238, 0.05)
Line Width: 0.5px
```

### Holographic Circles
```
Count: 2
Positions: 20% 30%, 80% 70%
Radii: 150px, 200px
Colors: Cyan (22,211,238), Purple (139,92,246)
Pulse Speed: 2x wave speed
Ring Opacity: 0.08 - 0.15
```

---

## Accessibility Specifications

### Focus Indicators
```
Outline: 1px solid cyan-400
Ring: 1px ring-cyan-400/50
Glow: 0 0 20px rgba(34, 211, 238, 0.15)
Visible: Yes, always (no outline: none)
Contrast: WCAG AA (4.5:1+)
```

### Color Contrast Ratios
| Text Color | Background | Ratio | Level |
|-----------|-----------|-------|-------|
| cyan-300 | #0a1f38 | 7.2:1 | AAA |
| blue-300 | #0d2a4a | 6.8:1 | AAA |
| white | #0a1f38 | 16:1 | AAA |
| red-300 | #0a1f38 | 5.5:1 | AA |

### Motion Preferences
```
Respects: prefers-reduced-motion
Fallback: Instant transitions (no animations)
Animation Intensity: Subtle (no parallax, no float)
```

---

## Performance Targets

### Metrics
- **FPS**: 60fps consistent
- **First Paint**: < 1s
- **Interaction Delay**: < 16ms
- **Particle Render**: < 5ms per frame
- **Memory Usage**: < 50MB

### Optimization Techniques
✅ Canvas rendering for particles
✅ GPU-accelerated CSS transforms
✅ Hardware-accelerated backdrop blur
✅ Debounced parallax
✅ Lazy component loading
✅ Request animation frame batching

---

## Browser CSS Support Requirements

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Backdrop Filter | 76+ | 103+ | 9+ | 79+ |
| CSS Gradients | All | All | All | All |
| CSS Custom Props | All | All | 9.1+ | 15+ |
| Canvas API | All | All | All | All |
| Will-change | 36+ | 36+ | 9.1+ | 15+ |

---

## Testing Specifications

### Visual Regression
- Screenshot tests on major breakpoints
- Animation smoothness verification
- Glow effect visibility check
- Color accuracy validation

### Interaction Testing
- All form inputs focusable
- All buttons clickable
- Animations trigger correctly
- Error states display
- Loading states show

### Performance Testing
- Lighthouse score > 90
- Core Web Vitals in green
- Particle animation smooth
- No jank or stuttering

### Accessibility Testing
- WAVE tool: 0 errors
- Axe-core: 0 violations
- Keyboard navigation: complete
- Screen reader: semantic HTML
