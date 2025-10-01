#!/bin/bash

# Build all Soroban contracts
# Usage: ./scripts/build-contracts.sh

set -e

# Ensure we use rustup-managed Rust, not Homebrew version
export PATH="$HOME/.cargo/bin:$PATH"

# Define paths to rustup and cargo (use full paths for reliability)
CARGO="$HOME/.cargo/bin/cargo"
RUSTUP="$HOME/.cargo/bin/rustup"

# Verify rustup is available
if [ ! -f "$RUSTUP" ]; then
    echo "❌ rustup not found at $RUSTUP"
    echo "   Please install Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

echo "🔨 Building All Soroban Contracts"
echo ""
echo "📦 Using Rust toolchain: $($RUSTUP show | grep 'active toolchain' | awk '{print $3}')"
echo ""

# Ensure wasm32-unknown-unknown target is installed
echo "🔧 Ensuring wasm32-unknown-unknown target is installed..."
$RUSTUP target add wasm32-unknown-unknown

# Build InvoiceToken contract
echo ""
echo "📦 Building InvoiceToken contract..."
cd contracts/invoice-token
$RUSTUP override set stable
$CARGO build --target wasm32-unknown-unknown --release
echo "✅ InvoiceToken built successfully"

# Build Escrow contract
echo ""
echo "📦 Building Escrow contract..."
cd ../escrow
$RUSTUP override set stable
$CARGO build --target wasm32-unknown-unknown --release
echo "✅ Escrow built successfully"

# Build Marketplace contract
echo ""
echo "📦 Building Marketplace contract..."
cd ../marketplace
$RUSTUP override set stable
$CARGO build --target wasm32-unknown-unknown --release
echo "✅ Marketplace built successfully"

cd ../../

echo ""
echo "🎉 All contracts built successfully!"
echo ""
echo "WASM files location:"
find contracts -name "*.wasm" -path "*/target/wasm32-unknown-unknown/release/*" ! -path "*/deps/*" -exec ls -lh {} \;

