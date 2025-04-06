# HealthyWorld - Health & Wellness Tracker Mini App

## Live Demo

Explore the HealthyWorld mini app in action by visiting our live demo:

[HealthyWorld Live Demo](https://healthy-world.vercel.app/)

## World Coin Mini App

Check out the integrated mini app for a streamlined experience:

[Open World Coin Mini App](https://worldcoin.org/mini-app?app_id=app_9b189afb0b482aaa44dd2ea83e20a589&draft_id=meta_061f08b05e59f133496afe5c5dc86d48)

HealthyWorld is a comprehensive health and wellness tracker built as a mini app for the World App platform. It enables users to track their health metrics, set wellness goals, participate in challenges, and earn rewards.

## Features

- Health Metrics Dashboard: Track steps, water intake, sleep, weight, and mindfulness activities.
- World ID Verification: Secure verification of unique human identity to prevent bots and multiple accounts.
- Wellness Challenges: Join community challenges to improve health habits and earn rewards.
- WLD Payments: Subscribe to premium plans using WLD or USDC through the World App payment system.
- Social Features: Invite friends to join challenges and build a community around wellness.
- Rewards System: Earn WLD tokens for completing health goals and challenges.
- MediaPipe Exercise Tracking: Uses MediaPipe to track user movements in real-time, ensuring exercises are performed correctly.
- ENS L2 Username Registration: Leverages an ENS L2 registrant on World Chain for decentralized username registration.
- Durin: For generating unique usernames and ENS integration
- World MiniKit: Integrates with World App for identity verification, payments, and sharing features.

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- World App installed on your mobile device

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/abhijeet1520/healthy-world.git
   cd healthy-world
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your World App credentials:
   ```
   WORLD_APP_ID=app_XXX
   WORLD_APP_API_KEY=YOUR_API_KEY
   NEXT_PUBLIC_PAYMENT_ADDRESS=YOUR_PAYMENT_ADDRESS
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open the app in the World App browser at `http://localhost:3000`

## Technologies Used

- Next.js: React framework for server-rendered applications
- World MiniKit: SDK for World App integration with verify, pay, and other commands
- Tailwind CSS: Utility-first CSS framework for styling
- Durin: For generating unique usernames and ENS integration
- MediaPipe: For real-time exercise tracking and movement analysis

## World App Integration

This mini app integrates with World App using the following MiniKit commands:

- Verify: For unique human identity verification
- Pay: For subscription and premium feature payments
- Share: For inviting friends to challenges

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- World Foundation for providing the Mini Apps platform and documentation
- The hackathon organizers and participants for inspiration

## This template provides a minimal setup to get Next.js working with MiniKit

## Setup

```bash
cp .env.example .env
pnpm i
pnpm dev
```

To run as a mini app choose a production app in the dev portal and use NGROK to tunnel. Set the `NEXTAUTH_URL` and the redirect url if using sign in with worldcoin to that ngrok url

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

To use the application, you'll need to:

1. Get World ID Credentials
   From the [World ID Developer Portal](https://developer.worldcoin.org/):

   - Create a new app to get your `APP_ID`
   - Get `DEV_PORTAL_API_KEY` from the API Keys section
   - Navigate to "Sign in with World ID" page to get:
     - `WLD_CLIENT_ID`
     - `WLD_CLIENT_SECRET`

2. Configure Action
   - In the Developer Portal, create an action in the "Incognito Actions" section
   - Use the same action name in `components/Verify/index.tsx`

View docs: [Docs](https://docs.world.org/)

[Developer Portal](https://developer.worldcoin.org/)

---

## ENS Integration and Registrar

### Blockchain Contract

You can view the HealthyWorld smart contract on the World Chain Mainnet for details about the ENS Registrar and other contract interactions:

[View HealthyWorld ENS transactions on WorldChain Mainnet Explorer](https://worldchain-mainnet.explorer.alchemy.com/address/0x8A9679F84A26532a7136c7f0Ab7721e243E4dd7A?tab=txs)

## L2 Registry Address

This environment variable designates the Layer 2 registry address used by HealthyWorld to connect with the correct checkpoint contract. It ensures that your application interacts with the intended Layer 2 infrastructure on the World Chain Mainnet.

For more details, view the registry on the explorer:
[Layer 2 Registry - WorldChain Mainnet Explorer](https://worldchain-mainnet.explorer.alchemy.com/address/0xba9f0059500df81eb4ab8ccd16fd3df379ba7c57?tab=txs)

Set the registry address in your environment configuration as shown:

```bash
L2_REGISTRY_ADDRESS=0xba9f0059500df81eb4ab8ccd16fd3df379ba7c57
```

HealthyWorld also supports an ENS-based username registration system on the **World Coin mainnet chain**. This is made possible through a custom registrar contract, **HealthyWorldRegistrarImplementation**, which inherits from the official ENS `BaseRegistrarImplementation`. Here’s how it works:

1. **Username Registration**
   - When a user joins HealthyWorld, they can optionally register a username (e.g., `alice.healthyworld.eth`) via our ENS registrar on the World Coin mainnet chain.
   - This username is an NFT minted by the registrar, tying your identity to the on-chain domain name.
   - **ENS L2 Registrant:** The registration is facilitated via an ENS L2 registrant, ensuring seamless integration with World Chain.

2. **Leaderboard and Health Data**
   - The registrar contract also stores (or references) a leaderboard rank and other metrics associated with your username. This allows for on-chain verification of your achievements and ranking, making it easy to build trust in leaderboards.
   - As users participate in challenges or earn rewards, their on-chain profile is updated with the latest achievements.

3. **Transaction Hash**
   - After registering your username or updating your health profile, you will receive a transaction hash. For example:
     ```
     0xb9f58...a3c7d9
     ```
     This hash serves as proof of the registration or update on the World Coin mainnet chain. You can click the hash in the app to view the details on the block explorer.

4. **Why ENS?**
   - By leveraging ENS, we enable a secure, decentralized naming system for user identities within HealthyWorld.
   - ENS subdomains are widely recognized across Web3, so your username can be easily integrated with other applications or wallets in the future.

5. **Integration Steps**
   - **Add Controller**: We ensure that only authorized addresses (controllers) can create or renew domain registrations.
   - **Register Username**: A user calls our `register(...)` function to mint the NFT and set associated health data.
   - **Update Profile**: Whenever a user completes a challenge or improves their rank, the contract can update their on-chain leaderboard data.

By combining ENS subdomains with the World App’s identity and payment features, HealthyWorld provides a seamless experience where your progress and achievements are cryptographically verifiable and portable across the wider blockchain ecosystem.
