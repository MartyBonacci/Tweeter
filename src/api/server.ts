import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { sql } from '../services/db.service.js';
import { errorHandler } from './middleware/error.middleware.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Session store using PostgreSQL
const PgSession = connectPgSimple(session);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'session',
    }),
    secret: process.env.SESSION_SECRET || 'development-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
    name: 'connect.sid',
  })
);

// API routes
import apiRoutes from './routes/index.js';
app.use('/api', apiRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
  });
}

export { app };
