#!/bin/sh
# Rejoin: cat dyatlov.mp4.part-* > dyatlov.mp4  (verify with: sha256sum -c SHA256SUMS)
cat "$(dirname "$0")"/dyatlov.mp4.part-* > "$(dirname "$0")/dyatlov.mp4"
echo "done: $(dirname "$0")/dyatlov.mp4"
