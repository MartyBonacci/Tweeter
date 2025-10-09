import { Router } from 'express';
import multer from 'multer';
import { ProfileSchema } from '../../schemas/profile.schema.js';
import {
  createProfile,
  getProfileByUserId,
  getProfileByUsername,
} from '../../services/profile.service.js';
import { uploadAvatar, validateImageFile } from '../../services/upload.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { sql } from '../../services/db.service.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/profiles
 * Create user profile (requires authentication)
 */
router.post('/', requireAuth, validate(ProfileSchema), async (req, res, next) => {
  try {
    const { displayName, bio, avatarUrl } = req.body;
    const userId = req.session.userId!;

    // Check if profile already exists
    const existingProfile = await getProfileByUserId(userId);
    if (existingProfile) {
      res.status(409).json({ error: 'Profile already exists' });
      return;
    }

    // Create profile
    const profile = await createProfile(userId, displayName, bio, avatarUrl);

    res.status(201).json({ profile });
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.code === '23505') {
      res.status(409).json({ error: 'Profile already exists' });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/profiles/avatar
 * Upload profile avatar (requires authentication)
 */
router.post(
  '/avatar',
  requireAuth,
  upload.single('file'),
  async (req, res, next) => {
    try {
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Validate file
      if (!validateImageFile(file)) {
        res.status(400).json({
          error: 'Invalid file. Must be an image (JPG, PNG, GIF, WebP) under 5MB',
        });
        return;
      }

      // Upload to Cloudinary
      const { url } = await uploadAvatar(file);

      // Update profile with avatar URL
      const userId = req.session.userId!;
      const profile = await getProfileByUserId(userId);

      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      // Update profile avatar (we'll add this later or do inline update)
      await sql`
        UPDATE profiles
        SET avatar_url = ${url}
        WHERE user_id = ${userId}
      `;

      res.status(200).json({ avatarUrl: url });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/profiles/:username
 * View public profile (no auth required)
 */
router.get('/:username', async (req, res, next) => {
  try {
    const { username } = req.params;

    const profile = await getProfileByUsername(username);

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
});

export default router;
