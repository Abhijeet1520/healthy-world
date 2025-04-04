# HealthyWorld - Health & Wellness Tracker Mini App

HealthyWorld is a comprehensive health and wellness tracker built as a mini app for the World App platform. It enables users to track their health metrics, set wellness goals, participate in challenges, and earn rewards.

## Features

- Health Metrics Dashboard: Track steps, water intake, sleep, weight, and mindfulness activities.
- World ID Verification: Secure verification of unique human identity to prevent bots and multiple accounts.
- Wellness Challenges: Join community challenges to improve health habits and earn rewards.
- WLD Payments: Subscribe to premium plans using WLD or USDC through the World App payment system.
- Social Features: Invite friends to join challenges and build a community around wellness.
- Rewards System: Earn WLD tokens for completing health goals and challenges.

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- World App installed on your mobile device

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/kamalbuilds/healthyworld.git
   cd healthyworld
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
