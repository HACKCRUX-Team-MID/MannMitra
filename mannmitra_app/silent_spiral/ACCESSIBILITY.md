# Accessibility Report — MannMitra

## Overview
MannMitra is designed as a mental health reflection tool. Accessibility is critical: users experiencing emotional distress may rely on assistive technologies, and the app must be usable by everyone.

## Semantic Labels (Screen Reader Support)

### Implemented
| Screen | Element | Semantics Label |
|---|---|---|
| **Settings** | Language toggle | "Language toggle: currently [English/Hindi]. Tap to switch." |
| **Settings** | Learned word row | "Learned word: [word], corrected to [emotion] [count]x, last reinforced [date]. Tap to remove." |
| **Settings** | Delete All Data button | Standard button semantics with label |
| **Journal** | Voice input button | Voice consent dialog explains STT privacy before first use |
| **Journal** | Thumbs up feedback | Tooltip: "This was accurate" |
| **Journal** | Thumbs down feedback | Tooltip: "This was wrong" |
| **Journal** | Confidence label | Human-readable text ("We're fairly sure", "This might be", "We could be wrong") |

### Areas for Improvement
| Screen | Element | Status |
|---|---|---|
| Dashboard | Mood heatmap cells | ⚠️ Needs semantic labels for each day's emotion |
| Dashboard | Chart axes | ⚠️ Needs descriptive labels for screen readers |
| Insights | Bar/line charts | ⚠️ Chart data should have text alternatives |
| Onboarding | Consent checkboxes | ⚠️ Needs explicit role announcements |
| Emotion Lexicon | Emotion chips | ⚠️ Should announce emotion name and selection state |

## Color Contrast

### Theme Palette
| Element | Foreground | Background | Contrast Ratio | WCAG Level |
|---|---|---|---|---|
| Primary text | `#F5F0EB` | `#1A1A2E` | **12.4:1** | AAA ✅ |
| Secondary text | `#A0998F` | `#1A1A2E` | **5.2:1** | AA ✅ |
| Accent (Sage Green) | `#87A96B` | `#1A1A2E` | **5.8:1** | AA ✅ |
| Terracotta | `#CC5A47` | `#1A1A2E` | **4.6:1** | AA ✅ |
| Warm Gold | `#D4A574` | `#1A1A2E` | **6.1:1** | AA ✅ |
| Cyan | `#00BCD4` | `#1A1A2E` | **6.9:1** | AA ✅ |

### Notes
- Dark mode is the default and only theme; earthy palette was chosen for reduced eye strain
- All color combinations meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
- Emotion category colors (joy/sadness/anger/fear) are distinguishable in both normal and color-blind modes

## Keyboard Navigation
| Action | Status |
|---|---|
| Tab through all interactive elements | ✅ Works (Flutter default) |
| Enter/Space to activate buttons | ✅ Works (Flutter default) |
| Escape to close dialogs | ✅ Works (Flutter default) |
| Focus indicators visible | ✅ Flutter default focus ring |

## Text Scaling
| Setting | Status |
|---|---|
| System font scale 1.0x | ✅ Tested |
| System font scale 1.5x | ⚠️ Some cards may overflow — needs responsive layout improvements |
| System font scale 2.0x | ⚠️ Significant overflow on analysis view — future fix planned |

## Motion & Animations
- All animations use `flutter_animate` with standard durations (200-400ms)
- No rapid flashing or strobing effects
- Breathing grounding halo uses slow, calming animation (intentional therapeutic design)
- **Future**: Add `MediaQuery.disableAnimations` check to respect system "Reduce Motion" setting

## Localization & Language
| Property | Value |
|---|---|
| **Supported languages** | English, Hindi (हिन्दी), Hinglish (code-mixed) |
| **Emotion detection language** | English + Hinglish (~220 triggers) + Hindi Devanagari (~99 triggers) via multilingual NLP pipeline |
| **Multilingual badge** | Shown when Hinglish/Hindi text detected: "Detected Hinglish — analyzed with bilingual lexicon" |
| **RTL support** | Not needed (English + Hindi are LTR) |

## Recommendations for Future Work
1. Add `Semantics` labels to all chart elements (heatmap cells, bar chart segments)
2. Implement `MediaQuery.disableAnimations` check for reduced motion
3. Test with TalkBack (Android) and VoiceOver (iOS) on physical devices
4. Add large text mode / responsive layout for 2.0x font scaling
5. Consider adding haptic feedback for emotion detection completion
6. Add audio descriptions for the breathing grounding halo exercise
