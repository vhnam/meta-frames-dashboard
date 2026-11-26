#!/usr/bin/env bash
# Fails on raw colors (palette classes, oklch, hex) in feature code.
# Run from the repository root. Allowed for now: the baseline below.
# Remove a file from the baseline when you fix it. Never add one.
set -euo pipefail

baseline=(
  src/features/cameras/pages/CameraDetailPage.vue
  src/features/film-stocks/format.ts
  src/features/film-stocks/pages/StockDetailPage.vue
  src/features/lab-orders/pages/LabOrderDetailPage.vue
  src/features/lenses/pages/LensDetailPage.vue
  src/features/rolls/pages/RollDetailPage.vue
  src/features/auth/components/auth-card/AuthCard.vue
)

# Permanent exceptions. Changes only with Nam's approval.
exceptions=(
  src/features/auth/components/google-sign-in/GoogleSignIn.vue # Google brand logo colors, fixed by Google's sign-in branding rules
)

palette='(bg|text|border|ring|fill|stroke|from|to|outline|divide|placeholder|caret|accent|shadow|decoration)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-[0-9]{2,3}'
pattern="${palette}|oklch\\(|#[0-9a-fA-F]{3,8}\\b"

# grep exits 0 (matches) or 1 (none). Any other status is a scan error.
scan_status=0
raw=$(grep -rnE "$pattern" src --include='*.vue' --include='*.ts' --include='*.css' \
  --exclude='*.test.ts' --exclude='*.spec.ts') || scan_status=$?
if [[ $scan_status -gt 1 ]]; then
  echo "check-raw-colors: scan of src failed (grep exit $scan_status)." >&2
  exit 2
fi
matches=$(grep -v -e '^src/shared/ui/' -e '^src/styles/design-tokens\.generated\.css:' <<< "$raw" || true)

status=0
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  file=${line%%:*}
  allowed=0
  for entry in "${baseline[@]}" "${exceptions[@]}"; do
    [[ "$file" == "$entry" ]] && allowed=1
  done
  if [[ $allowed -eq 0 ]]; then
    echo "$line"
    status=1
  fi
done <<< "$matches"

for entry in "${baseline[@]}"; do
  entry_status=0
  grep -qE "$pattern" "$entry" 2>/dev/null || entry_status=$?
  if [[ $entry_status -eq 1 ]]; then
    echo "$entry: no raw color left. Remove it from the baseline in scripts/check-raw-colors.sh."
    status=1
  elif [[ $entry_status -gt 1 ]]; then
    echo "check-raw-colors: cannot read baseline file $entry (grep exit $entry_status)." >&2
    exit 2
  fi
done

exit "$status"
