# API Keys & Secrets Guide

This guide explains which API keys you need for the **Antigravity Casino** and how to obtain them.

## 1. Core Secrets

### `JWT_SECRET`
- **Purpose**: Used to sign and verify admin authentication tokens.
- **How to get**: You can generate a random string.
- **Example**: `openssl rand -base64 32` (on a terminal) or any long random string.

## 2. Blockchain (Ethereum/Polygon)

### `ETH_RPC_URL`
- **Purpose**: Allows the backend to communicate with the blockchain.
- **How to get**:
  1. Go to [Alchemy](https://www.alchemy.com/), [Infura](https://www.infura.io/), or [Quicknode](https://www.quicknode.com/).
  2. Create a new App (choose Polygon or Ethereum).
  3. Copy the HTTP RPC URL provided.

### `ADMIN_PRIVATE_KEY`
- **Purpose**: Used by the backend to sign transactions (e.g., executing withdrawals from the contract).
- **How to get**: This is the private key of the wallet you used to deploy the contract or a wallet designated as an admin.
- **Safety**: **NEVER** share this key with anyone.

### `CASINO_CONTRACT_ADDRESS`
- **Purpose**: The address of your deployed `AntigravityCasino.sol` contract.
- **How to get**: Deployed via Remix, Hardhat, or Foundry. Copy the address after deployment.

### `HOUSE_WALLET`
- **Purpose**: The address that will receive the casino's earnings.
- **How to get**: Your personal or multisig wallet address.

## 3. Payments (Binance Pay)

### `BINANCE_API_KEY` & `BINANCE_API_SECRET`
- **Purpose**: For integrating Binance Pay deposits.
- **How to get**: 
  1. Sign up for a [Binance Merchant](https://merchant.binance.com/) account.
  2. Complete KYC and go to the Developer Center to generate API keys.

## 4. Configuration

### Cloudflare Pages (Production)
If you are deploying to Cloudflare Pages:
1. Go to your project in the Cloudflare Dashboard.
2. **Settings** -> **Functions** -> **Environment variables**.
3. Add each key there.

### Dokploy (VPS)
If you are deploying via Dokploy:
1. Go to your Application in Dokploy.
2. **Environment** tab.
3. Add the keys as specified in the `.env.example`.
