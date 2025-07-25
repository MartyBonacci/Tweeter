# Tweeter

A clone of Twitter back when Tweets were only 140 characters.

## Description
Tweeter is a simplified social media platform inspired by the early days of Twitter. Users can create short messages (Tweets) of up to 140 characters, follow other users, and view a timeline of their followed users' Tweets.

## Tech Stack
- Frontend: React with React Router 7 (framework mode with programmatic routes)
- Backend: Node.js with TypeScript
- Database: PostgreSQL (hosted on Neon)
- ORM: Drizzle ORM
- Validation: Zod
- Styling: TailwindCSS
- Build Tool: Vite

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=your_neon_postgresql_connection_string
   ```

4. Run database migrations:
   ```bash
   npm run migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Usage
After starting the development server, navigate to `http://localhost:5173` in your browser to access the application.

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a pull request

## License
This project is licensed under the MIT License - see the LICENSE file for details.