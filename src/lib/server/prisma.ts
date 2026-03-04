// src/lib/server/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { DATABASE_URL } from '$env/static/private';

// Create a connection pool to the database
const pool = new Pool({ connectionString: DATABASE_URL });

// Create the Prisma adapter
const adapter = new PrismaPg(pool);

// Create the Prisma client, passing it the adapter
const prisma = new PrismaClient({ adapter });

export default prisma;
    