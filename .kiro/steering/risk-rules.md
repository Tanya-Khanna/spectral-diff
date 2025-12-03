# Risk Rules (Deterministic)

Risk score 0–100 computed from exact weights:

## Signal Weights
| Signal | Points | Severity |
|--------|--------|----------|
| CI checks failing | +35 | critical |
| Touches sensitive path (auth/, payments/, .github/workflows/) | +25 | warn |
| Large change (500+ LOC) | +20 | warn |
| Medium change (100-500 LOC) | +10 | info |
| No tests modified when code modified | +20 | warn |
| High churn file (churnScore >= 70) | +10 | info |
| High complexity (5+ control flow indicators) | +10 | info |
| Dependency file changed (package.json, lockfiles) | +15 | warn |
| Workflow insecurity (unpinned actions, broad permissions, PR target) | +40 | critical |

Score caps at 100.

## GitHub Actions Security Lint
Critical findings that trigger +40:
- `UNPINNED_ACTION`: uses: owner/repo@v3 (not SHA-pinned)
- `BROAD_PERMISSIONS`: permissions: write-all
- `PR_TARGET_WITH_WRITE`: pull_request_target + write permissions

## Visual Mapping (Bands)
| Score | Band | Fog | Scratches | Sigils |
|-------|------|-----|-----------|--------|
| 0-20 | bright | none | small | none |
| 20-50 | dim | low | medium | none |
| 50-80 | dark | med | pulse | ⚠️ warning |
| 80-100 | cursed | high | bleed | 💀 critical |

## Implementation
- Risk engine: `apps/web/src/lib/risk/`
- Scoring: `score.ts` → `computeRoomRisk()`
- Actions lint: `actionsLint.ts` → `lintWorkflowDiff()`
- Visuals: `visuals.ts` → `riskToVisual()`
