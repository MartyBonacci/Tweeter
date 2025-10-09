import 'dotenv/config';
import { sql } from '../src/services/db.service.js';

async function verifyTable() {
  try {
    // Check if tweets table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'tweets'
      );
    `;
    console.log('✓ Tweets table exists:', tableExists[0].exists);

    // Check indexes
    const indexes = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'tweets';
    `;
    console.log('✓ Indexes created:', indexes.map(i => i.indexname).join(', '));

    // Check foreign key constraint
    const constraints = await sql`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'tweets'::regclass;
    `;
    console.log('✓ Constraints:', constraints.map(c => c.conname).join(', '));

    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verifyTable();
