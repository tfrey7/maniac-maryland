#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
env_file="$script_dir/../.env"
if [[ -f "$env_file" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$env_file"
  set +a
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY not set" >&2
  exit 1
fi

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <output-path> <prompt> [size] [downscale]" >&2
  echo "  size:      1024x1024 (default), 1024x1536, 1536x1024" >&2
  echo "  downscale: optional WxH (e.g. 128x192). When set, the API output is" >&2
  echo "             saved to <output>@source.png and a nearest-neighbor" >&2
  echo "             downscale is saved to <output>." >&2
  exit 1
fi

output="$1"
prompt="$2"
size="${3:-1024x1024}"
downscale="${4:-}"

mkdir -p "$(dirname "$output")"

payload=$(jq -n --arg p "$prompt" --arg s "$size" \
  '{model: "gpt-image-1", prompt: $p, size: $s, n: 1, background: "transparent", output_format: "png"}')

response=$(curl -sS https://api.openai.com/v1/images/generations \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$payload")

if echo "$response" | jq -e '.error' >/dev/null; then
  echo "$response" | jq '.error' >&2
  exit 1
fi

if [[ -n "$downscale" ]]; then
  # Validate format
  if [[ ! "$downscale" =~ ^[0-9]+x[0-9]+$ ]]; then
    echo "Invalid downscale format: $downscale (expected WxH)" >&2
    exit 1
  fi
  width="${downscale%x*}"
  height="${downscale#*x}"

  # Save raw API output as the source
  base="${output%.*}"
  ext="${output##*.}"
  source_path="${base}@source.${ext}"
  echo "$response" | jq -r '.data[0].b64_json' | base64 -d > "$source_path"

  # Nearest-neighbor downscale via Pillow
  python3 - "$source_path" "$output" "$width" "$height" <<'PY'
import sys
from PIL import Image
src_path, out_path, w, h = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
im = Image.open(src_path)
if im.mode != 'RGBA':
    im = im.convert('RGBA')
im.resize((w, h), Image.NEAREST).save(out_path)
PY
  echo "Saved: $output (downscaled ${width}x${height} from ${source_path})"
else
  echo "$response" | jq -r '.data[0].b64_json' | base64 -d > "$output"
  echo "Saved: $output"
fi
