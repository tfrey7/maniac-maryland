#!/usr/bin/env bash
set -euo pipefail

# Generates one mumble-TTS OGG per dialogue line.
# File: assets/audio/speech/<lineId>.<sha8>.ogg where sha8 = sha256(speaker:text)[:8]
# Filter chain: macOS `say` (per-speaker voice) -> ffmpeg (pitch, lowpass, bitcrush) -> oggenc (vorbis)
# Modes:
#   (no args)  generate missing, skip up-to-date, prune orphans, write manifest.json
#   --check    exit 1 if any line is missing/stale; print what's wrong; do not write
# Portable to bash 3.2 (macOS default).

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIALOGUE="$ROOT/src/data/dialogue.json"
OUTDIR="$ROOT/assets/audio/speech"
MANIFEST="$OUTDIR/manifest.json"

CHECK=0
if [ "${1:-}" = "--check" ]; then CHECK=1; fi

FFMPEG="$(command -v ffmpeg || echo /opt/homebrew/bin/ffmpeg)"
OGGENC="$(command -v oggenc || echo /opt/homebrew/bin/oggenc)"
SAY="$(command -v say || echo /usr/bin/say)"
SHASUM="$(command -v shasum || echo /usr/bin/shasum)"
JQ="$(command -v jq || echo /usr/bin/jq)"

for bin in "$FFMPEG" "$OGGENC" "$SAY" "$SHASUM" "$JQ"; do
  [ -x "$bin" ] || { echo "Missing required tool: $bin" >&2; exit 2; }
done

mkdir -p "$OUTDIR"

voice_for() {
  case "$1" in
    mcnulty)  echo "Daniel|0.92" ;;
    bunk)     echo "Fred|0.78" ;;
    handyman) echo "Ralph|0.85" ;;
    *)        echo "Daniel|0.90" ;;
  esac
}

sha8() {
  printf "%s" "$1" | "$SHASUM" -a 256 | cut -c1-8
}

gen_one() {
  local id="$1" speaker="$2" text="$3" out="$4"
  local cfg voice pitch tmpdir aiff wav
  cfg="$(voice_for "$speaker")"
  voice="${cfg%|*}"
  pitch="${cfg#*|}"
  tmpdir="$(mktemp -d)"
  aiff="$tmpdir/say.aiff"
  wav="$tmpdir/processed.wav"
  "$SAY" -v "$voice" -o "$aiff" "$text"
  # asetrate = pitch shift (changes speed + pitch); aresample restores rate.
  # lowpass 500Hz strips intelligibility; acrusher bitcrushes for lo-fi grit.
  "$FFMPEG" -hide_banner -loglevel error -y -i "$aiff" \
    -af "asetrate=22050*${pitch},aresample=22050,lowpass=f=500,acrusher=bits=4:samples=8:mode=lin:mix=1,volume=2.5" \
    -ac 1 -ar 22050 -c:a pcm_s16le "$wav"
  "$OGGENC" -Q -q 2 -o "$out" "$wav"
  rm -rf "$tmpdir"
}

# Build a TSV of (id, speaker, text) — multi-line entries become id-0, id-1, ...
SPEC_TSV="$("$JQ" -r '
  to_entries[] |
    if (.value | type) == "array" then
      .key as $k | .value | to_entries[] |
        [($k + "-" + (.key|tostring)), .value.speaker, .value.text] | @tsv
    else
      [.key, .value.speaker, .value.text] | @tsv
    end
' "$DIALOGUE")"

WANTED_FILE="$(mktemp)"
MANIFEST_TSV="$(mktemp)"
MISSING_FILE="$(mktemp)"
trap 'rm -f "$WANTED_FILE" "$MANIFEST_TSV" "$MISSING_FILE"' EXIT

while IFS=$'\t' read -r id speaker text; do
  [ -z "$id" ] && continue
  hash="$(sha8 "${speaker}:${text}")"
  filename="${id}.${hash}.ogg"
  out="$OUTDIR/$filename"
  printf '%s\n' "$filename" >> "$WANTED_FILE"
  printf '%s\t%s\n' "$id" "$filename" >> "$MANIFEST_TSV"
  if [ ! -f "$out" ]; then
    if [ "$CHECK" -eq 1 ]; then
      printf '  %s -> missing %s\n' "$id" "$filename" >> "$MISSING_FILE"
    else
      echo "gen  $id ($speaker) -> $filename"
      gen_one "$id" "$speaker" "$text" "$out"
    fi
  fi
done <<<"$SPEC_TSV"

# Detect orphans (existing .ogg files not in WANTED_FILE).
ORPHAN_FILE="$(mktemp)"
trap 'rm -f "$WANTED_FILE" "$MANIFEST_TSV" "$MISSING_FILE" "$ORPHAN_FILE"' EXIT
shopt -s nullglob
for f in "$OUTDIR"/*.ogg; do
  base="$(basename "$f")"
  if ! grep -qxF "$base" "$WANTED_FILE"; then
    printf '%s\n' "$base" >> "$ORPHAN_FILE"
  fi
done
shopt -u nullglob

if [ "$CHECK" -eq 1 ]; then
  status=0
  if [ -s "$MISSING_FILE" ]; then
    echo "Missing or stale stems:" >&2
    cat "$MISSING_FILE" >&2
    status=1
  fi
  if [ -s "$ORPHAN_FILE" ]; then
    echo "Orphan stems (hash no longer matches dialogue.json):" >&2
    sed 's/^/  /' "$ORPHAN_FILE" >&2
    status=1
  fi
  if [ ! -f "$MANIFEST" ]; then
    echo "Missing manifest: $MANIFEST" >&2
    status=1
  fi
  exit "$status"
fi

# Prune orphans.
if [ -s "$ORPHAN_FILE" ]; then
  while IFS= read -r o; do
    echo "rm   $o"
    rm -f "$OUTDIR/$o"
  done < "$ORPHAN_FILE"
fi

# Emit manifest (lineId -> filename). jq builds it from the TSV so escaping is correct.
"$JQ" -R -s '
  split("\n") | map(select(length>0) | split("\t") | {key:.[0], value:.[1]}) | from_entries
' "$MANIFEST_TSV" > "$MANIFEST"

count="$(wc -l < "$WANTED_FILE" | tr -d ' ')"
echo "ok   $count stems, $(du -sh "$OUTDIR" | cut -f1) on disk"
