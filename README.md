# Tweeter

A clone of Twitter when Tweets were only 140 characters, built with modern web technologies.

## Description

Tweeter is a social media platform that replicates the classic Twitter experience with 140-character limit posts. Users can create accounts, post tweets, follow other users, and engage with content through likes and retweets.

## Tech Stack

- **Frontend**: React Router 7 (Framework Mode), TypeScript, TailwindCSS
- **Backend**: PostgreSQL (Neon), Drizzle ORM, Zod for validation
- **Build Tool**: Vite
- **ID Generation**: UUIDv7
- **Architecture**: Routes, controllers, and models separated in their own files

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd tweeter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with the required database and API configuration.

4. Run database migrations:
   ```bash
   npm run migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

- Visit `http://localhost:3000` to access the application
- Create an account or sign in with existing credentials
- Post tweets (limited to 140 characters)
- Follow other users
- Like and retweet content

## Contributing

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your feature description"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.