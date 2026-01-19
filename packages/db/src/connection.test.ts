// packages/db/src/connection.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { drizzle } from 'drizzle-orm/node-postgres'
import { sql } from 'drizzle-orm'
import pg from 'pg'

describe('database connection', () => {
  let pool: pg.Pool
  let db: ReturnType<typeof drizzle>

  beforeAll(() => {
    const connectionString =
      process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/gemhog'

    pool = new pg.Pool({ connectionString })
    db = drizzle(pool)
  })

  afterAll(async () => {
    await pool.end()
  })

  it('should connect and execute a query', async () => {
    const result = await db.execute(sql`SELECT 1 as value`)
    expect(result.rows[0]).toEqual({ value: 1 })
  })

  it('should return current timestamp', async () => {
    const result = await db.execute(sql`SELECT NOW() as now`)
    expect(result.rows[0].now).toBeInstanceOf(Date)
  })
})
