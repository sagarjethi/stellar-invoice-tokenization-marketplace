# StellarFlow Smart Contracts

This directory contains the Soroban smart contracts for StellarFlow (Invoice Tokenization Platform).

## Contracts

### 1. InvoiceToken (`invoice-token/`)
Manages invoice tokens with minting, burning, and transfer capabilities.

**Key Functions:**
- `initialize()` - Initialize contract with invoice metadata
- `balance()` - Get token balance for an address
- `total_supply()` - Get total token supply
- `transfer()` - Transfer tokens between addresses
- `mint()` - Mint new tokens (admin only)
- `burn()` - Burn tokens
- `get_invoice_id()` - Get invoice ID
- `get_metadata_hash()` - Get invoice metadata hash

**Storage:**
- Instance storage for contract configuration
- Per-address balances stored as tuple keys

### 2. Escrow (`escrow/`)
Holds investor funds and releases them upon payment confirmation.

**Key Functions:**
- `initialize()` - Initialize escrow for an invoice
- `deposit()` - Deposit funds from investor
- `get_status()` - Get escrow status
- `get_total_deposited()` - Get total deposited amount
- `is_fully_funded()` - Check if escrow is fully funded
- `release_payment()` - Release funds after payment confirmation
- `handle_default()` - Handle default scenario (admin only)

**Storage:**
- Instance storage for escrow configuration
- Per-investor deposits stored as tuple keys

### 3. Marketplace (`marketplace/`)
Lists invoice tokens and facilitates purchases.

**Key Functions:**
- `initialize()` - Initialize marketplace contract
- `list_token()` - List an invoice token for sale (admin only)
- `purchase()` - Purchase invoice tokens
- `get_listing()` - Get listing details
- `get_active_listings()` - Get all active listings
- `remove_listing()` - Remove a listing (admin only)

**Storage:**
- Instance storage for marketplace configuration
- Per-listing data stored as tuple keys
- Active listings stored as Vec<String>

## Building Contracts

### Prerequisites
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm32 target
rustup target add wasm32-unknown-unknown
```

### Build Individual Contract
```bash
cd contracts/<contract-name>
rustup override set stable
cargo build --target wasm32-unknown-unknown --release
```

### Build All Contracts
```bash
./scripts/deploy/deploy-contracts.sh
```

## Best Practices Implemented

1. **Initialization Protection**
   - All contracts check if already initialized
   - Prevents re-initialization attacks

2. **Input Validation**
   - Amount validation (must be positive)
   - Rate validation (discount rate bounds)
   - Status checks before operations

3. **Access Control**
   - Admin-only functions protected
   - User authentication required for sensitive operations

4. **Storage Patterns**
   - Instance storage for contract configuration
   - Tuple keys for per-user/per-listing data
   - Proper use of persistent vs temporary storage

5. **Error Handling**
   - Clear panic messages
   - Status checks before state transitions
   - Balance checks before transfers

## Testing

Run tests for a contract:
```bash
cd contracts/<contract-name>
cargo test --target wasm32-unknown-unknown
```

## Deployment

See `scripts/deploy/deploy-contracts.sh` for deployment instructions.

After deployment, update contract addresses in `backend/.env`:
```env
INVOICE_TOKEN_CONTRACT_ID=<deployed_address>
ESCROW_CONTRACT_ID=<deployed_address>
MARKETPLACE_CONTRACT_ID=<deployed_address>
```

## Contract Interactions

### Flow: Invoice Tokenization
1. Backend calls `InvoiceToken::initialize()` with invoice data
2. Contract stores metadata hash and mints tokens
3. Backend calls `Marketplace::list_token()` to make available

### Flow: Investor Purchase
1. Investor calls `Marketplace::purchase()` with amount
2. Marketplace validates and calls `Escrow::deposit()`
3. Escrow updates deposit tracking
4. Tokens transferred via `InvoiceToken::transfer()`

### Flow: Payment Confirmation
1. Verifier/Admin calls `Escrow::release_payment()`
2. Escrow status updated to Released
3. Backend triggers payout distribution

## Security Considerations

- All admin functions require authentication
- Initialization can only happen once
- Input validation on all user inputs
- Balance checks before transfers
- Status checks before state transitions
