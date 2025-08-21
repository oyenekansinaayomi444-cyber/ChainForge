# ChainForge

A blockchain-powered platform for transparent, secure, and sustainable supply chain tracking in manufacturing, ensuring trust in component provenance, automated payments, and eco-friendly incentives.

---

## Overview

ChainForge addresses critical issues in manufacturing supply chains: opaque tracking, payment disputes, and lack of incentives for sustainable practices. By leveraging the Stacks blockchain and Clarity smart contracts, it provides immutable component tracking, automates payments, and rewards sustainable manufacturing. The platform consists of four main smart contracts:

1. **Component Tracking Contract** – Tracks component lifecycle from production to delivery with immutable provenance records.
2. **Payment Escrow Contract** – Automates secure payments between manufacturers and suppliers using milestones.
3. **Sustainability Incentives Contract** – Rewards suppliers for eco-friendly practices with tokenized credits.
4. **Oracle Data Contract** – Integrates off-chain IoT and certification data for real-time verification.

---

## Problem Solved

In industries like aerospace or automotive, counterfeit parts and lack of transparency lead to safety risks and costly disputes (e.g., 2019 Boeing 737 MAX issues partly tied to supply chain gaps). Additionally, manufacturers struggle to verify sustainable practices, despite growing demand (e.g., 68% of EU consumers prefer eco-friendly products, per 2023 surveys). ChainForge ensures:

- **Transparency**: Immutable records of component origin, materials, and handling.
- **Trust**: Automated, dispute-free payments via smart contracts.
- **Sustainability**: Tokenized incentives for green manufacturing practices.
- **Efficiency**: Real-time IoT integration reduces manual verification.

---

## Features

- **Provenance Tracking**: Immutable records of component production, testing, and delivery.
- **Automated Payments**: Escrow-based payments triggered by verified milestones (e.g., quality checks or delivery).
- **Sustainability Rewards**: Tokenized credits for suppliers using eco-friendly materials or processes.
- **IoT Integration**: Real-time data from IoT devices (e.g., sensors on assembly lines) for verification.
- **Auditable Logs**: Transparent, on-chain history for all stakeholders.
- **Cross-Company Access**: Permissioned access to data for manufacturers, suppliers, and regulators.

---

## Smart Contracts

### Component Tracking Contract
- Records component details (e.g., serial number, materials, production date) on-chain.
- Tracks lifecycle events (e.g., quality tests, shipping) with timestamps and supplier IDs.
- Provides public read access for regulators or buyers to verify provenance.

### Payment Escrow Contract
- Locks funds in escrow until predefined milestones (e.g., quality certification or delivery) are met.
- Releases payments automatically via oracle-verified data.
- Handles disputes by allowing partial releases or refunds.

### Sustainability Incentives Contract
- Issues tokenized credits (e.g., "GreenForge Tokens") to suppliers meeting sustainability criteria (e.g., low-carbon materials).
- Tracks certifications (e.g., ISO 14001) via oracle data.
- Enables trading of credits among suppliers or redemption for discounts.

### Oracle Data Contract
- Integrates off-chain data (e.g., IoT sensor readings, sustainability certificates) into the blockchain.
- Verifies milestones (e.g., component delivery or quality pass) for escrow releases.
- Ensures secure, tamper-proof data feeds for real-time updates.

---

## Installation

1. Install [Clarinet CLI](https://docs.hiro.so/clarinet/getting-started):
   ```bash
   npm install -g @hirosystems/clarinet
   ```
2. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/chainforge.git
   ```
3. Navigate to the project directory and run tests:
   ```bash
   cd chainforge
   clarinet test
   ```
4. Deploy contracts to a Stacks testnet:
   ```bash
   clarinet deploy
   ```

---

## Usage

Each smart contract is modular but interoperates to form the ChainForge ecosystem:

- **Component Tracking**: Suppliers call functions to log component data (e.g., `register-component` with serial number and material details).
- **Payment Escrow**: Manufacturers deposit funds via `lock-funds`, and suppliers claim payments with `claim-milestone` after oracle verification.
- **Sustainability Incentives**: Suppliers submit certifications via `submit-certification`, earning tokens redeemable with `redeem-credits`.
- **Oracle Data**: Oracles push IoT or certification data via `update-data`, triggering contract actions.

Refer to individual contract documentation for detailed function calls and parameters.

---

## Example Workflow

1. A supplier registers a component (e.g., turbine blade) with serial number and material details in the Component Tracking Contract.
2. The manufacturer locks payment in the Payment Escrow Contract, tied to milestones (e.g., quality test passed, delivery confirmed).
3. IoT sensors report quality test results to the Oracle Data Contract, triggering escrow release.
4. The supplier submits a sustainability certificate (e.g., recycled materials used), earning GreenForge Tokens via the Sustainability Incentives Contract.
5. Regulators verify the component’s provenance on-chain, ensuring compliance.

---

## License

MIT License

