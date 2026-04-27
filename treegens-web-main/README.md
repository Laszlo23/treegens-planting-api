# 🌳 TreeGens Frontend

A decentralized tree planting verification platform built with Next.js that enables users to document and verify tree planting activities through video submissions

**Monorepo:** full-stack setup (FastAPI, Node API, this app, cloud checklist) is documented in the repository root [`README.md`](../README.md).

## ✨ Features

- **🎥 Video Verification**: Upload land/plant videos of tree planting activities
- **🔗 Storage**: Video storage using FileBase
- **👤 Web3 Authentication**: Google OAuth and wallet-based login via Thirdweb
- **📱 Mobile-First Design**: Responsive UI optimized for mobile devices
- **🏆 Leaderboard**: Track and rank community tree planting contributions
- **📍 GPS Integration**: Location-based verification for submissions
- **⚡ Real-time Review**: Community-driven submission approval system

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Flowbite React
- **Authentication**: Thirdweb (Google OAuth + Wallet Connect)
- **Storage**: FileBase
- **State Management**: React Context
- **HTTP Client**: Axios

## 🚀 Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd treegens-frontend
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables:

   ```env
   NEXT_PUBLIC_IPFS_GATEWAY=your-gateway
   NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-thirdweb-client-id
   NEXT_PUBLIC_API_URL=https://your-node-api-origin.example
   ```

4. **Run the development server**

   ```bash
   yarn dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Key Pages

- **Dashboard**: Overview of submissions and recent activity
- **New Plant**: Upload land/plant videos with GPS verification
- **My Plants**: View your submitted tree planting videos
- **Submissions**: Review community submissions
- **Leaderboard**: Top contributors and statistics

## 🌍 Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with 💚 for a greener future**
