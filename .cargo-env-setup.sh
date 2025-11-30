#!/bin/bash

# Source this file to set up Rust environment correctly
# Usage: source .cargo-env-setup.sh

export PATH="$HOME/.cargo/bin:$PATH"

# Verify rustup is available
if [ ! -f "$HOME/.cargo/bin/rustup" ]; then
    echo "⚠️  Warning: rustup not found. Install Rust with:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    return 1
fi

# Ensure wasm32-unknown-unknown target is installed
$HOME/.cargo/bin/rustup target add wasm32-unknown-unknown > /dev/null 2>&1

echo "✅ Rust environment configured"
echo "   Rust version: $($HOME/.cargo/bin/rustc --version)"
echo "   Cargo version: $($HOME/.cargo/bin/cargo --version)"
echo "   WASM target: installed"

