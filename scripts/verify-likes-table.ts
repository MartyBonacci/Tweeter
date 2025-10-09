import 'dotenv/config';
import { sql } from '../src/services/db.service.js';

async function verifyTable() {
  try {
    // Check if likes table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'likes'
      );
    `;
    console.log('✓ Likes table exists:', tableExists[0].exists);

    // Check indexes
    const indexes = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'likes';
    `;
    console.log('✓ Indexes created:', indexes.map(i => i.indexname).join(', '));

    // Check constraints
    const constraints = await sql`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'likes'::regclass;
    `;
    console.log('✓ Constraints:', constraints.map(c => c.conname).join(', '));

    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verifyTable();
