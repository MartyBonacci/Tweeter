# Tweeter

A minimalist Twitter clone that brings back the simplicity of 140-character tweets. Built with modern web technologies while maintaining the charm of early Twitter.

## Features

- **140-character tweets** - Keep it short and sweet
- **User authentication** - Secure signup and login
- **Timeline** - See tweets from people you follow
- **Following system** - Follow and unfollow users
- **Likes and retweets** - Interact with tweets
- **User profiles** - View user timelines and stats
- **Real-time updates** - See new tweets as they arrive

## Tech Stack

- **Frontend Framework:** React with React Router 7 (framework mode)
- **Routing:** Programmatic routes with separated controllers
- **Database:** PostgreSQL (hosted on Neon)
- **ORM:** Drizzle ORM
- **Validation:** Zod
- **Styling:** TailwindCSS
- **Language:** TypeScript
- **Build Tool:** Vite
- **IDs:** UUIDv7

## Installation

### Prerequisites

- Node.js 20+ 
- npm or yarn
- PostgreSQL database (or Neon account)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tweeter.git
cd tweeter
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials and other configuration:
```env
DATABASE_URL=postgres://user:password@host/database
JWT_SECRET=your-secret-key
```

4. Run database migrations:
```bash
npm run db:migrate
```

5. (Optional) Seed the database:
```bash
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Development

### Project Structure

```
src/
├── routes/         # React Router route definitions
├── controllers/    # Business logic handlers
├── models/         # Database models and schemas
├── components/     # React components
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
└── db/            # Database configuration and migrations
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

### Coding Conventions

- **JavaScript/TypeScript:** camelCase for variables and functions
- **Database:** snake_case with table prefixes (e.g., `tweet_id`, `user_email`)
- **Components:** PascalCase for React components
- **Files:** kebab-case for file names

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- All tests pass
- Code follows the established conventions
- New features include appropriate tests
- Documentation is updated as needed

## API Documentation

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login to existing account
- `POST /api/auth/logout` - Logout current user

### Tweets
- `GET /api/tweets` - Get timeline tweets
- `POST /api/tweets` - Create new tweet
- `GET /api/tweets/:id` - Get specific tweet
- `DELETE /api/tweets/:id` - Delete tweet

### Users
- `GET /api/users/:username` - Get user profile
- `GET /api/users/:username/tweets` - Get user's tweets
- `POST /api/users/:username/follow` - Follow user
- `DELETE /api/users/:username/follow` - Unfollow user

### Interactions
- `POST /api/tweets/:id/like` - Like tweet
- `DELETE /api/tweets/:id/like` - Unlike tweet
- `POST /api/tweets/:id/retweet` - Retweet
- `DELETE /api/tweets/:id/retweet` - Remove retweet

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the simplicity of early Twitter
- Built with modern web development best practices
- Thanks to all contributors and supporters