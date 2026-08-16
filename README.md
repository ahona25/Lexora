# Lexora

> A modern real-time communication and collaboration platform built with Next.js, React, TypeScript, Supabase, Socket.IO, and PeerJS.

## 🚀 Overview

Lexora is a modern web-based communication platform designed to provide users with a responsive and interactive environment for real-time communication and collaboration.

The application is built around a modern full-stack web architecture using Next.js and React on the frontend, with Supabase and real-time communication technologies supporting the application's backend functionality.

## ✨ Features

* Modern and responsive web interface
* Real-time communication capabilities
* Peer-to-peer communication support
* Real-time socket-based connectivity
* Supabase integration
* Responsive user experience across desktop and mobile devices
* Modern icon-based interface
* TypeScript-based development
* Component-driven React architecture
* Production-ready Next.js application
* Vercel deployment support

## 🛠️ Technology Stack

| Technology       | Purpose                                   |
| ---------------- | ----------------------------------------- |
| Next.js 16       | Application framework                     |
| React 19         | User interface                            |
| TypeScript       | Type-safe development                     |
| Tailwind CSS 4   | Styling and responsive UI                 |
| Supabase         | Backend services and database integration |
| Socket.IO Client | Real-time communication                   |
| PeerJS           | Peer-to-peer communication                |
| Lucide React     | UI icons                                  |
| ESLint           | Code quality and linting                  |
| Vercel           | Deployment                                |

## 🏗️ Architecture

Lexora follows a modern frontend architecture based on Next.js and React.

```text
Lexora
│
├── Frontend
│   ├── Next.js
│   ├── React
│   ├── TypeScript
│   └── Tailwind CSS
│
├── Real-Time Layer
│   ├── Socket.IO
│   └── PeerJS
│
├── Backend Services
│   └── Supabase
│
└── Deployment
    └── Vercel
```

### Application Flow

```text
User
  │
  ▼
Next.js Application
  │
  ├── React UI
  │
  ├── Supabase
  │
  ├── Socket.IO
  │
  └── PeerJS
        │
        ▼
Real-Time Communication
```

## 📂 Project Structure

```text
Lexora/
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── .gitignore
│   ├── AGENTS.md
│   ├── CLAUDE.md
│   ├── eslint.config.mjs
│   ├── next.config.ts
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.mjs
│   ├── tsconfig.json
│   └── README.md
│
└── README.md
```

## ⚙️ Requirements

Before running Lexora locally, make sure the following are installed:

* Node.js
* npm
* Git

## 📥 Installation

Clone the repository:

```bash
git clone https://github.com/ahona25/Lexora.git
```

Navigate to the frontend directory:

```bash
cd Lexora/frontend
```

Install dependencies:

```bash
npm install
```

## 🔐 Environment Configuration

Create an environment file inside the `frontend` directory:

```text
.env.local
```

Add the required environment variables for your Supabase and other real-time services according to the configuration used by the application.

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Never commit private API keys, service-role keys, passwords, or other sensitive credentials to GitHub.

## ▶️ Run Locally

Start the development server:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

The repository's Next.js configuration also provides an HTTPS development command:

```bash
npm run dev:https
```

## 🏭 Production Build

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

Run the project's linter:

```bash
npm run lint
```

## 🌐 Live Application

Lexora is deployed on Vercel:

https://lexora-snowy-ten.vercel.app/

## 🔄 Development Workflow

```text
1. Clone repository
       ↓
2. Install dependencies
       ↓
3. Configure environment variables
       ↓
4. Start development server
       ↓
5. Develop and test features
       ↓
6. Run linting
       ↓
7. Create production build
       ↓
8. Deploy
```

## 📱 Responsive Design

Lexora is designed as a modern web application with responsive UI considerations for different screen sizes, including desktop and mobile environments.

The interface is implemented using Tailwind CSS and React components, allowing the application to adapt its layout and presentation across different devices.

## 🔌 Real-Time Communication

Lexora uses multiple technologies for real-time and peer-to-peer functionality:

### Socket.IO

Socket.IO Client provides the client-side layer for real-time socket communication.

### PeerJS

PeerJS provides peer-to-peer communication capabilities through WebRTC-based connections.

### Supabase

Supabase provides backend services and database connectivity for application data and related functionality.

## 🧪 Quality & Development

The project uses ESLint for code-quality checking and TypeScript for static type checking.

Before submitting changes, developers should verify:

```bash
npm run lint
npm run build
```

## 🚀 Deployment

Lexora can be deployed using Vercel or another platform capable of hosting Next.js applications.

For Vercel deployment:

1. Import the GitHub repository.
2. Set the project root to `frontend`.
3. Configure the required environment variables.
4. Build the application.
5. Deploy the project.

## 🤝 Contributing

Contributions are welcome.

To contribute:

```bash
git clone https://github.com/ahona25/Lexora.git
cd Lexora/frontend
npm install
```

Create a new branch:

```bash
git checkout -b feature/your-feature
```

Make your changes, test the application, and submit a pull request.

## 🔒 Security

Do not commit:

* API keys
* Supabase service-role keys
* Passwords
* Authentication secrets
* Private credentials
* Production environment files

Use environment variables for sensitive configuration.

## 📌 Project Status

Lexora is an actively developed web application. Features and implementation details may evolve as the project continues to develop.

## 👥 Contributors

<a href="https://github.com/ahona25">
  <img src="https://github.com/ahona25.png" width="80px" alt="Ahona25"/>
</a>

### Ahona25

GitHub: https://github.com/ahona25

## 📚 Technologies & References

* Next.js
* React
* TypeScript
* Tailwind CSS
* Supabase
* Socket.IO
* PeerJS
* Vercel

## 📄 License

Refer to the repository for the project's applicable license and usage terms.

---

<p align="center">
  <strong>Lexora</strong>
  <br>
  Built with Next.js, React, TypeScript and modern real-time web technologies.
</p>
