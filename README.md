# Tweeter 🐦

A nostalgic clone of Twitter back when tweets were limited to 140 characters, built with modern web technologies.

## Project Description

Tweeter brings back the simplicity of early Twitter - a platform for sharing short, 140-character messages. This project demonstrates modern web development practices while capturing the essence of Twitter's original charm.

## Tech Stack

- **Frontend**: React Router 7 (Framework Mode)
- **Backend**: TypeScript with Vite
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Styling**: TailwindCSS
- **IDs**: UUIDv7
- **Build Tool**: Vite

## Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- pnpm or npm

### Setup

1. Clone the repository
```bash
git clone [repository-url]
cd tweeter
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration:
# - DATABASE_URL: Your PostgreSQL connection string (Neon recommended)
# - JWT_SECRET: A strong random string for authentication
# - CLOUDINARY_*: Your Cloudinary credentials for image uploads
# - MAILGUN_*: Your Mailgun credentials for email verification
# - APP_URL: Your application URL (use http://localhost:5173 for development)
```

4. Set up the database
```bash
pnpm db:push
pnpm db:seed
```

5. Start the development server
```bash
pnpm dev
```

## Usage

### Development
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm test         # Run tests
pnpm lint         # Run linter
pnpm typecheck    # Run TypeScript checks
```

### Database
```bash
pnpm db:generate  # Generate migrations
pnpm db:push      # Push schema to database
pnpm db:seed      # Seed database with test data
```

## Project Structure

```
tweeter/
├── src/
│   ├── routes/          # React Router routes
│   ├── controllers/     # API controllers
│   ├── models/          # Database models
│   ├── components/      # React components
│   ├── lib/            # Utilities and helpers
│   └── styles/         # Tailwind styles
├── drizzle/            # Database migrations
├── tests/              # Test files
└── docs/               # Documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

### Commit Message Convention
- \`feat:\` New feature
- \`fix:\` Bug fix
- \`docs:\` Documentation changes
- \`style:\` Code style changes
- \`refactor:\` Code refactoring
- \`test:\` Test additions or changes
- \`chore:\` Build process or auxiliary tool changes

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Features

### ✅ Implemented
- ✅ User authentication and profiles with email verification
- ✅ 140-character tweet posting with real-time validation
- ✅ Timeline feed with infinite scroll
- ✅ Follow/unfollow functionality with real-time counts
- ✅ Like system with instant feedback
- ✅ Mobile-responsive design
- ✅ Profile editing with Cloudinary image uploads
- ✅ Search functionality (users, tweets, hashtags)
- ✅ Performance optimizations with React.memo and loading skeletons

### 🔄 In Progress
- [ ] Real-time notifications
- [ ] Enhanced error boundaries

### 🚀 Future Features
- [ ] Retweet functionality
- [ ] Direct messaging
- [ ] Tweet threading
- [ ] Push notifications

## Third-Party Services

This project integrates with:
- **[Cloudinary](https://cloudinary.com)**: Image upload and optimization
- **[Mailgun](https://mailgun.com)**: Email verification and notifications
- **[Neon](https://neon.tech)**: PostgreSQL database hosting
EOF < /dev/null
