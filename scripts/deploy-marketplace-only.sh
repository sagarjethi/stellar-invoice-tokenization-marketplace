#!/bin/bash
set -e

# Setup environment
export PATH="$HOME/.cargo/bin:$PATH"
CARGO="$HOME/.cargo/bin/cargo"
RUSTUP="$HOME/.cargo/bin/rustup"
SOROBAN="$HOME/.cargo/bin/soroban"

NETWORK="testnet"
RPC_URL="https://rpc.ankr.com/stellar_testnet_soroban/f12d040dee298e264912b6eaa724be2d315020944f9ae8d43fd7baf41599ae76"
PASSPHRASE="Test SDF Network ; September 2015"
SOURCE="default"

echo "🔨 Building Marketplace contract..."
cd contracts/marketplace
$RUSTUP override set stable
$CARGO clean
$CARGO build --target wasm32-unknown-unknown --release

WASM="target/wasm32-unknown-unknown/release/marketplace.wasm"
echo "✅ Built: $WASM"

# Optimize manually using soroban built-in (if available via cargo) or just deploy raw to test
# We will try deploying the raw one first as 'cargo build' with correct profile should be enough

echo "🚀 Uploading Marketplace..."
HASH=$($SOROBAN contract upload \
    --wasm "$WASM" \
    --network "$NETWORK" \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$PASSPHRASE" \
    --source-account "$SOURCE" 2>&1 | tee /dev/tty | grep -oE '[a-f0-9]{64}' | head -1)

if [ -z "$HASH" ]; then
    echo "❌ Upload failed"
    exit 1
fi

echo "✅ Uploaded Hash: $HASH"
echo "🚀 Deploying Marketplace..."

ID=$($SOROBAN contract deploy \
    --wasm-hash "$HASH" \
    --network "$NETWORK" \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$PASSPHRASE" \
    --source-account "$SOURCE" 2>&1 | tee /dev/tty | grep -oE '[A-Z0-9]{56}' | head -1)

if [ -z "$ID" ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo ""
echo "🎉 SUCCESS! Marketplace Contract ID: $ID"
echo "MARKETPLACE_CONTRACT_ID=$ID"

