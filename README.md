# StellarFlow: Decentralized Invoice Factoring & Liquidity Platform

> **Repository:** `stellar-invoice-tokenization-marketplace`

A decentralized invoice factoring and financing platform built on Stellar Soroban smart contracts to provide instant business liquidity. Allows Small and Medium Businesses (SMBs) to tokenize their invoices and receive upfront capital from investors.

## Project Structure

```
steller/
├── frontend/          # Next.js/React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Next.js pages
│   │   ├── lib/           # Utility libraries (Stellar SDK, etc.)
│   │   ├── types/         # TypeScript type definitions
│   │   └── styles/        # CSS/styling files
│   └── public/            # Static assets
│
├── backend/           # Node.js API server
│   └── src/
│       ├── controllers/   # Route controllers
│       ├── models/        # Database models
│       ├── routes/        # API routes
│       ├── services/      # Business logic services
│       ├── middleware/    # Express middleware
│       ├── utils/         # Utility functions
│       └── config/        # Configuration files
│
├── contracts/         # Soroban smart contracts
│   ├── invoice-token/     # Invoice token contract
│   ├── escrow/            # Escrow contract
│   └── marketplace/       # Marketplace contract
│
├── docs/              # Documentation
│   ├── api/               # API documentation
│   ├── contracts/         # Smart contract documentation
│   └── architecture/      # Architecture diagrams and docs
│
└── scripts/           # Utility scripts
    ├── deploy/            # Deployment scripts
    └── test/              # Testing scripts
```

## Problem Statement

Businesses often wait 30–120 days for invoice payments, causing cash flow problems. Traditional invoice financing is costly, slow, and paperwork-heavy. Investors also struggle to access reliable, short-term, yield-generating financial products.

## Solution Summary

A Stellar-based marketplace where:
- SMBs upload invoices
- A corresponding Invoice Token is minted on Stellar
- Investors purchase these tokens at a discount
- Funds are escrowed and automatically released when invoice payment is confirmed
- Investors earn yield; SMBs get instant liquidity

## Core Objectives

- Simplify access to working capital for businesses
- Enable global investors to fund receivables
- Provide automated, trustless settlement using Soroban contracts
- Ensure transparency with on-chain invoice metadata hashes
- Support future secondary markets for invoice tokens

## Target Users

- **SMB / Business Owner**: Creates and tokenizes invoices to receive liquidity
- **Investor / Liquidity Provider**: Buys invoice tokens and earns yield
- **Verifier / Oracle**: Confirms off-chain invoice payment
- **Platform Admin**: Manages onboarding, KYC, fraud checks

## System Architecture

- **Web App**: React/Next.js frontend
- **Backend**: Node.js API + database
- **Smart Contracts**: Soroban contracts (InvoiceToken, Escrow, Marketplace)
- **Storage**: On-chain metadata hashes, off-chain invoices and KYC data

## Smart Contracts

### Invoice Token Contract
- Create invoice token (unique ID)
- Store hash of invoice metadata
- Mint/burn tokens
- Transfer rules for secondary market

### Escrow Contract
- Hold investor funds
- Release funds upon payment confirmation
- Handle defaults (manual trigger)

### Marketplace Contract
- List invoice tokens
- Allow investor purchase
- Emit events for frontend

## Core Flows

### Flow 1: Invoice Upload & Tokenization
1. SMB uploads invoice metadata
2. Backend verifies basic fields
3. Soroban InvoiceToken contract mints invoice token
4. Token listed on marketplace

### Flow 2: Investor Purchase
1. Investor selects invoice token
2. Sends funds → Escrow contract
3. Escrow updates token ownership

### Flow 3: Payment Confirmation
1. Verifier confirms invoice is paid
2. Escrow contract releases payout to investor & SMB

### Flow 4: Default
1. Invoice not paid by due date
2. Admin triggers default handler

## Getting Started

### Prerequisites
- Node.js (v18+)
- Rust (for Soroban contracts)
- Stellar SDK
- Soroban CLI

### Installation

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install

# Contracts
cd contracts/invoice-token
# Follow Soroban contract setup
```

## Development

### Frontend
```bash
cd frontend
npm run dev
```

### Backend
```bash
cd backend
npm run dev
```

### Contracts
```bash
cd contracts/invoice-token
soroban contract build
```

## Milestones

### Phase 1 (MVP)
- Invoice upload
- Token minting
- Marketplace listing
- Investor purchase
- Escrow contract
- Manual payment confirmation

## License

[To be determined]

