#!/bin/bash
set -e

# Usage: ./scripts/optimize-wasm.sh path/to/contract.wasm path/to/output.wasm

INPUT_WASM=$1
OUTPUT_WASM=$2

if [ -z "$INPUT_WASM" ] || [ -z "$OUTPUT_WASM" ]; then
    echo "Usage: $0 <input_wasm> <output_wasm>"
    exit 1
fi

echo "🔧 Optimizing $INPUT_WASM..."

# Use wasm-opt to optimize and disable reference types
# -O4: aggressive optimization
# --disable-reference-types: explicitly disable reference types
# --disable-bulk-memory: disabling bulk memory just in case (often related)
# --strip-debug: remove debug info
wasm-opt "$INPUT_WASM" -o "$OUTPUT_WASM" -O4 \
    --disable-reference-types \
    --disable-bulk-memory \
    --strip-debug

echo "✅ Optimized to $OUTPUT_WASM"

