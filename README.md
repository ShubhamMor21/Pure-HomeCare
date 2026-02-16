# VR Device Management Dashboard

A modern, high-performance web dashboard for monitoring and controlling VR devices in real-time. Built with a focus on visual excellence and seamless user experience.

## ✨ Features

- **Real-time Device Monitoring**: Track status (Online/Offline), battery levels, and current activities of all connected VR headsets.
- **Remote Session Control**: Start, pause, resume, and stop VR sessions across multiple devices simultaneously.
- **Activity Management**: Select from a library of VR activities and specific videos to launch on devices.
- **Session History**: Detailed logs of past sessions for auditing and usage analysis.
- **Responsive Design**: Premium, "glassmorphic" UI that works across desktop and mobile devices.

## 🛠️ Technology Stack

- **Frontend Framework**: [React](https://reactjs.org/) with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- **State Management & Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router](https://reactrouter.com/)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vr-game-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env` and configure your API endpoints.
   ```bash
   cp .env.example .env
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🏗️ Building for Production

To create an optimized production build:

```bash
npm run build
```

The output will be in the `dist/` directory.

## 🧪 Testing

Run the test suite using Vitest:

```bash
npm run test
```

