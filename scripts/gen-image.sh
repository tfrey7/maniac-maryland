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

refs=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --ref)
      refs+=("$2")
      shift 2
      ;;
    --)
      shift
      break
      ;;
    *)
      break
      ;;
  esac
done

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 [--ref <image>]... <output-path> <prompt> [size] [downscale] [crop]" >&2
  echo "  --ref:     reference image; pass multiple times for multi-reference edits." >&2
  echo "             When set, uses images/edits to render variations of the ref." >&2
  echo "  size:      1024x1024 (default), 1024x1536, 1536x1024" >&2
  echo "  downscale: optional WxH (e.g. 128x192). When set, the API output is" >&2
  echo "             saved to <output>@source.png and a nearest-neighbor" >&2
  echo "             downscale is saved to <output>." >&2
  echo "  crop:      optional WxH applied (centered) to the API output before" >&2
  echo "             downscale. Use to convert the 3:2 source to a different" >&2
  echo "             aspect (e.g. 1536x864 for 16:9). Requires downscale." >&2
  exit 1
fi

output="$1"
prompt="$2"
size="${3:-1024x1024}"
downscale="${4:-}"
crop="${5:-}"

mkdir -p "$(dirname "$output")"

if [[ ${#refs[@]} -gt 0 ]]; then
  curl_args=(-sS https://api.openai.com/v1/images/edits
    -H "Authorization: Bearer $OPENAI_API_KEY"
    -F "model=gpt-image-1"
    -F "prompt=$prompt"
    -F "size=$size"
    -F "n=1"
    -F "background=transparent"
    -F "output_format=png")
  for ref in "${refs[@]}"; do
    if [[ ! -f "$ref" ]]; then
      echo "Reference image not found: $ref" >&2
      exit 1
    fi
    curl_args+=(-F "image[]=@$ref")
  done
  response=$(curl "${curl_args[@]}")
else
  payload=$(jq -n --arg p "$prompt" --arg s "$size" \
    '{model: "gpt-image-1", prompt: $p, size: $s, n: 1, background: "transparent", output_format: "png"}')

  response=$(curl -sS https://api.openai.com/v1/images/generations \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload")
fi

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

  crop_w=0
  crop_h=0
  if [[ -n "$crop" ]]; then
    if [[ ! "$crop" =~ ^[0-9]+x[0-9]+$ ]]; then
      echo "Invalid crop format: $crop (expected WxH)" >&2
      exit 1
    fi
    crop_w="${crop%x*}"
    crop_h="${crop#*x}"
  fi

  # Save raw API output as the source
  base="${output%.*}"
  ext="${output##*.}"
  source_path="${base}@source.${ext}"
  echo "$response" | jq -r '.data[0].b64_json' | base64 -d > "$source_path"

  # Optional center-crop, then nearest-neighbor downscale via Pillow
  python3 - "$source_path" "$output" "$width" "$height" "$crop_w" "$crop_h" <<'PY'
import sys
from PIL import Image
src_path, out_path = sys.argv[1], sys.argv[2]
w, h = int(sys.argv[3]), int(sys.argv[4])
cw, ch = int(sys.argv[5]), int(sys.argv[6])
im = Image.open(src_path)
if im.mode != 'RGBA':
    im = im.convert('RGBA')
if cw > 0 and ch > 0:
    sw, sh = im.size
    if cw > sw or ch > sh:
        sys.exit(f"Crop {cw}x{ch} exceeds source {sw}x{sh}")
    left = (sw - cw) // 2
    top = (sh - ch) // 2
    im = im.crop((left, top, left + cw, top + ch))
im.resize((w, h), Image.NEAREST).save(out_path)
PY
  if [[ "$crop_w" -gt 0 ]]; then
    echo "Saved: $output (cropped ${crop_w}x${crop_h}, downscaled ${width}x${height} from ${source_path})"
  else
    echo "Saved: $output (downscaled ${width}x${height} from ${source_path})"
  fi
else
  echo "$response" | jq -r '.data[0].b64_json' | base64 -d > "$output"
  echo "Saved: $output"
fi
