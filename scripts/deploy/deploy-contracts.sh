#!/bin/bash

# Deploy Soroban contracts to Stellar testnet
# Usage: ./scripts/deploy/deploy-contracts.sh

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

echo "🚀 Deploying Soroban Contracts to Stellar Testnet"
echo ""
echo "📦 Using Rust toolchain: $($RUSTUP show | grep 'active toolchain' | awk '{print $3}')"
echo ""

# Check if soroban CLI is installed
if ! command -v soroban &> /dev/null; then
    echo "❌ Soroban CLI not found. Installing..."
    
    # Check if Rust/Cargo is installed
    if ! command -v cargo &> /dev/null; then
        echo "⚠️  Cargo not found. Please install Rust first:"
        echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
        exit 1
    fi
    
    # Try installing via cargo (most reliable method)
    echo "📦 Installing Soroban CLI via Cargo..."
    if cargo install --locked soroban-cli; then
        echo "✅ Soroban CLI installed successfully via Cargo"
    else
        # Fallback: try the official installer script
        echo "⚠️  Cargo install failed. Trying official installer..."
        if curl -sSf https://install.soroban.stellar.org | sh; then
            export PATH="$HOME/.local/bin:$PATH"
            echo "✅ Soroban CLI installed via official installer"
        else
            echo "❌ Failed to install Soroban CLI"
            echo ""
            echo "Please install manually:"
            echo "  1. Install Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
            echo "  2. Install Soroban: cargo install --locked soroban-cli"
            exit 1
        fi
    fi
    
    # Verify installation
    if ! command -v soroban &> /dev/null; then
        export PATH="$HOME/.cargo/bin:$PATH"
        if ! command -v soroban &> /dev/null; then
            echo "❌ Soroban CLI still not found in PATH"
            echo "   Please add ~/.cargo/bin to your PATH or restart your terminal"
            exit 1
        fi
    fi
fi

# Check if network is configured
NETWORK="testnet"
# Use Ankr RPC endpoint for Stellar testnet
RPC_URL="https://rpc.ankr.com/stellar_testnet_soroban/f12d040dee298e264912b6eaa724be2d315020944f9ae8d43fd7baf41599ae76"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
echo "📡 Network: $NETWORK"
echo "🔗 RPC URL: $RPC_URL"

# Define paths to rustup and cargo
CARGO="$HOME/.cargo/bin/cargo"
RUSTUP="$HOME/.cargo/bin/rustup"
SOROBAN="$HOME/.cargo/bin/soroban"

# Fallback if soroban binary not found at full path
if [ ! -f "$SOROBAN" ]; then
    SOROBAN="soroban"
fi

# Ensure target is installed using full path
$RUSTUP target add wasm32-unknown-unknown

# Build InvoiceToken contract
echo ""
echo "📦 Building InvoiceToken contract..."
cd contracts/invoice-token
$RUSTUP override set stable
$CARGO build --target wasm32-unknown-unknown --release
INVOICE_TOKEN_WASM=$(find target/wasm32-unknown-unknown/release -name "invoice_token.wasm" | head -1)

if [ -z "$INVOICE_TOKEN_WASM" ]; then
    echo "❌ Failed to build InvoiceToken contract"
    exit 1
fi

echo "✅ InvoiceToken built: $INVOICE_TOKEN_WASM"

# Build Escrow contract
echo ""
echo "📦 Building Escrow contract..."
cd ../escrow
$RUSTUP override set stable
$CARGO clean 2>/dev/null || true
$CARGO build --target wasm32-unknown-unknown --release
ESCROW_WASM=$(find target/wasm32-unknown-unknown/release -name "escrow.wasm" ! -path "*/deps/*" | head -1)

if [ -z "$ESCROW_WASM" ]; then
    echo "❌ Failed to build Escrow contract"
    exit 1
fi

echo "✅ Escrow built: $ESCROW_WASM"

        # Build Marketplace contract
        echo ""
        echo "📦 Building Marketplace contract..."
        cd ../marketplace
        # Use soroban CLI to build with optimization
        $SOROBAN contract build --optimize
        MARKETPLACE_WASM=$(find target/wasm32-unknown-unknown/release -name "marketplace.optimized.wasm" | head -1)
        
        # Fallback if optimized file not found
        if [ -z "$MARKETPLACE_WASM" ]; then
             MARKETPLACE_WASM=$(find target/wasm32-unknown-unknown/release -name "marketplace.wasm" ! -path "*/deps/*" | head -1)
        fi

if [ -z "$MARKETPLACE_WASM" ]; then
    echo "❌ Failed to build Marketplace contract"
    exit 1
fi

echo "✅ Marketplace built: $MARKETPLACE_WASM"

# Deploy contracts (if soroban CLI is available)
if [ -f "$SOROBAN" ] || command -v soroban &> /dev/null; then
    echo ""
    echo "🚀 Deploying contracts to $NETWORK..."
    
    # Check if we have a source account configured
    SOURCE_ACCOUNT="default"
    HAS_KEY=false
    
    # Check for keys
    if $SOROBAN keys ls 2>/dev/null | grep -q "$SOURCE_ACCOUNT"; then
        HAS_KEY=true
    elif $SOROBAN keys ls 2>/dev/null | grep -q "."; then
        # Use first available key if default doesn't exist
        SOURCE_ACCOUNT=$($SOROBAN keys ls 2>/dev/null | head -1 | awk '{print $1}')
        HAS_KEY=true
    fi
    
    if [ "$HAS_KEY" = false ]; then
        echo "⚠️  No keys found. You need a funded Stellar account for deployment."
        echo ""
        echo "📝 To set up a testnet account:"
        echo "   1. Visit: https://laboratory.stellar.org/#account-creator?network=test"
        echo "   2. Create and fund a testnet account"
        echo "   3. Add the key: $SOROBAN keys add $SOURCE_ACCOUNT --secret-key YOUR_SECRET_KEY"
        echo ""
        INVOICE_TOKEN_ID="NEEDS_KEY"
        ESCROW_ID="NEEDS_KEY"
        MARKETPLACE_ID="NEEDS_KEY"
    else
        echo "📝 Using source account: $SOURCE_ACCOUNT"
        echo ""
        
        # Deploy InvoiceToken (two-step: upload then deploy)
        echo "📦 Deploying InvoiceToken..."
        cd ../invoice-token
        
        # Step 1: Upload contract
        echo "   Step 1/2: Uploading contract (this may take a moment)..."
        INVOICE_TOKEN_HASH=$($SOROBAN contract upload \
            --wasm "$INVOICE_TOKEN_WASM" \
            --network "$NETWORK" \
            --rpc-url "$RPC_URL" \
            --network-passphrase "$NETWORK_PASSPHRASE" \
            --source-account "$SOURCE_ACCOUNT" 2>&1 | tee /dev/tty)
        
        if echo "$INVOICE_TOKEN_HASH" | grep -q "error\|Error\|ERROR\|failed\|Failed"; then
            echo "❌ InvoiceToken upload failed:"
            echo "$INVOICE_TOKEN_HASH" | head -10
            INVOICE_TOKEN_ID="DEPLOY_FAILED"
        else
            # Extract hash (remove any extra output)
            INVOICE_TOKEN_HASH=$(echo "$INVOICE_TOKEN_HASH" | grep -oE '[a-f0-9]{64}' | head -1)
            if [ -z "$INVOICE_TOKEN_HASH" ]; then
                INVOICE_TOKEN_HASH=$(echo "$INVOICE_TOKEN_HASH" | tail -1 | tr -d '[:space:]')
            fi
            echo "   ✅ Uploaded (hash: ${INVOICE_TOKEN_HASH:0:16}...)"
            
            # Wait a moment for the upload to propagate
            echo "   ⏳ Waiting for upload to propagate..."
            sleep 3
            
            # Step 2: Deploy contract
            echo "   Step 2/2: Deploying contract instance..."
            INVOICE_TOKEN_OUTPUT=$($SOROBAN contract deploy \
                --wasm-hash "$INVOICE_TOKEN_HASH" \
                --network "$NETWORK" \
                --rpc-url "$RPC_URL" \
                --network-passphrase "$NETWORK_PASSPHRASE" \
                --source-account "$SOURCE_ACCOUNT" 2>&1 | tee /dev/tty)
            
            if echo "$INVOICE_TOKEN_OUTPUT" | grep -q "error\|Error\|ERROR\|failed\|Failed"; then
                echo "❌ InvoiceToken deployment failed:"
                echo "$INVOICE_TOKEN_OUTPUT" | head -10
                INVOICE_TOKEN_ID="DEPLOY_FAILED"
            else
                INVOICE_TOKEN_ID=$(echo "$INVOICE_TOKEN_OUTPUT" | grep -oE '[A-Z0-9]{56}' | head -1)
                if [ -z "$INVOICE_TOKEN_ID" ]; then
                    INVOICE_TOKEN_ID=$(echo "$INVOICE_TOKEN_OUTPUT" | tail -1 | tr -d '[:space:]')
                fi
                echo "✅ InvoiceToken deployed: $INVOICE_TOKEN_ID"
            fi
        fi
        
        # Deploy Escrow (two-step: upload then deploy)
        echo ""
        echo "📦 Deploying Escrow..."
        cd ../escrow
        
        # Step 1: Upload contract
        echo "   Step 1/2: Uploading contract (this may take a moment)..."
        ESCROW_HASH=$($SOROBAN contract upload \
            --wasm "$ESCROW_WASM" \
            --network "$NETWORK" \
            --rpc-url "$RPC_URL" \
            --network-passphrase "$NETWORK_PASSPHRASE" \
            --source-account "$SOURCE_ACCOUNT" 2>&1 | tee /dev/tty)
        
        if echo "$ESCROW_HASH" | grep -q "error\|Error\|ERROR\|failed\|Failed"; then
            echo "❌ Escrow upload failed:"
            echo "$ESCROW_HASH" | head -10
            ESCROW_ID="DEPLOY_FAILED"
        else
            # Extract hash
            ESCROW_HASH=$(echo "$ESCROW_HASH" | grep -oE '[a-f0-9]{64}' | head -1)
            if [ -z "$ESCROW_HASH" ]; then
                ESCROW_HASH=$(echo "$ESCROW_HASH" | tail -1 | tr -d '[:space:]')
            fi
            echo "   ✅ Uploaded (hash: ${ESCROW_HASH:0:16}...)"
            
            # Wait a moment for the upload to propagate
            echo "   ⏳ Waiting for upload to propagate..."
            sleep 3
            
            # Step 2: Deploy contract
            echo "   Step 2/2: Deploying contract instance..."
            ESCROW_OUTPUT=$($SOROBAN contract deploy \
                --wasm-hash "$ESCROW_HASH" \
                --network "$NETWORK" \
                --rpc-url "$RPC_URL" \
                --network-passphrase "$NETWORK_PASSPHRASE" \
                --source-account "$SOURCE_ACCOUNT" 2>&1 | tee /dev/tty)
            
            if echo "$ESCROW_OUTPUT" | grep -q "error\|Error\|ERROR\|failed\|Failed"; then
                echo "❌ Escrow deployment failed:"
                echo "$ESCROW_OUTPUT" | head -10
                ESCROW_ID="DEPLOY_FAILED"
            else
                ESCROW_ID=$(echo "$ESCROW_OUTPUT" | grep -oE '[A-Z0-9]{56}' | head -1)
                if [ -z "$ESCROW_ID" ]; then
                    ESCROW_ID=$(echo "$ESCROW_OUTPUT" | tail -1 | tr -d '[:space:]')
                fi
                echo "✅ Escrow deployed: $ESCROW_ID"
            fi
        fi
        
        # Deploy Marketplace (two-step: upload then deploy)
        echo ""
        echo "📦 Deploying Marketplace..."
        cd ../marketplace
        
        # Step 1: Upload contract
        echo "   Step 1/2: Uploading contract (this may take a moment)..."
        MARKETPLACE_HASH=$($SOROBAN contract upload \
            --wasm "$MARKETPLACE_WASM" \
            --network "$NETWORK" \
            --rpc-url "$RPC_URL" \
            --network-passphrase "$NETWORK_PASSPHRASE" \
            --source-account "$SOURCE_ACCOUNT" 2>&1 | tee /dev/tty)
        
        if echo "$MARKETPLACE_HASH" | grep -q "error\|Error\|ERROR\|failed\|Failed"; then
            echo "❌ Marketplace upload failed:"
            echo "$MARKETPLACE_HASH" | head -10
            MARKETPLACE_ID="DEPLOY_FAILED"
        else
            # Extract hash
            MARKETPLACE_HASH=$(echo "$MARKETPLACE_HASH" | grep -oE '[a-f0-9]{64}' | head -1)
            if [ -z "$MARKETPLACE_HASH" ]; then
                MARKETPLACE_HASH=$(echo "$MARKETPLACE_HASH" | tail -1 | tr -d '[:space:]')
            fi
            echo "   ✅ Uploaded (hash: ${MARKETPLACE_HASH:0:16}...)"
            
            # Step 2: Deploy contract
            echo "   Step 2/2: Deploying contract instance..."
            MARKETPLACE_OUTPUT=$($SOROBAN contract deploy \
                --wasm-hash "$MARKETPLACE_HASH" \
                --network "$NETWORK" \
                --rpc-url "$RPC_URL" \
                --network-passphrase "$NETWORK_PASSPHRASE" \
                --source-account "$SOURCE_ACCOUNT" 2>&1 | tee /dev/tty)
            
            if echo "$MARKETPLACE_OUTPUT" | grep -q "error\|Error\|ERROR\|failed\|Failed"; then
                echo "❌ Marketplace deployment failed:"
                echo "$MARKETPLACE_OUTPUT" | head -10
                MARKETPLACE_ID="DEPLOY_FAILED"
            else
                MARKETPLACE_ID=$(echo "$MARKETPLACE_OUTPUT" | grep -oE '[A-Z0-9]{56}' | head -1)
                if [ -z "$MARKETPLACE_ID" ]; then
                    MARKETPLACE_ID=$(echo "$MARKETPLACE_OUTPUT" | tail -1 | tr -d '[:space:]')
                fi
                echo "✅ Marketplace deployed: $MARKETPLACE_ID"
            fi
        fi
    fi
else
    echo ""
    echo "⚠️  Soroban CLI not found. Contracts built but not deployed."
    echo "   Install Soroban CLI: curl -sSf https://install.soroban.stellar.org | sh"
    INVOICE_TOKEN_ID="NOT_DEPLOYED"
    ESCROW_ID="NOT_DEPLOYED"
    MARKETPLACE_ID="NOT_DEPLOYED"
fi

cd ../../

echo ""
if [ "$INVOICE_TOKEN_ID" != "DEPLOY_FAILED" ] && [ "$INVOICE_TOKEN_ID" != "NEEDS_KEY" ] && [ "$INVOICE_TOKEN_ID" != "NOT_DEPLOYED" ]; then
    echo "🎉 All contracts deployed successfully!"
    echo ""
    echo "Contract Addresses:"
    echo "  INVOICE_TOKEN_CONTRACT_ID=$INVOICE_TOKEN_ID"
    echo "  ESCROW_CONTRACT_ID=$ESCROW_ID"
    echo "  MARKETPLACE_CONTRACT_ID=$MARKETPLACE_ID"
    echo ""
    echo "📝 Update these in backend/.env file:"
    echo ""
    echo "INVOICE_TOKEN_CONTRACT_ID=$INVOICE_TOKEN_ID"
    echo "ESCROW_CONTRACT_ID=$ESCROW_ID"
    echo "MARKETPLACE_CONTRACT_ID=$MARKETPLACE_ID"
else
    echo "⚠️  Contracts built but not deployed."
    echo ""
    if [ "$INVOICE_TOKEN_ID" = "NEEDS_KEY" ]; then
        echo "📖 See DEPLOYMENT_SETUP.md for instructions on setting up a Stellar account."
    fi
    echo ""
    echo "Contract Status:"
    echo "  InvoiceToken: $INVOICE_TOKEN_ID"
    echo "  Escrow: $ESCROW_ID"
    echo "  Marketplace: $MARKETPLACE_ID"
fi

