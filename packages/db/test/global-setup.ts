// packages/db/test/global-setup.ts
import { execSync } from 'child_process'

export async function setup() {
  const dbUrl = process.env.DATABASE_URL || ''

  // Skip Docker setup if using external database (Test-stage AWS)
  if (dbUrl && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) {
    console.log('Using external database, skipping Docker setup')
    return
  }

  const cwd = new URL('..', import.meta.url).pathname

  // Check if container is running
  try {
    const result = execSync('docker compose ps --filter status=running --format json', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    if (result.includes('gemhog-postgres')) {
      console.log('PostgreSQL container already running')
      await waitForPostgres(cwd)
      return
    }
  } catch {
    // Container not running, will start below
  }

  console.log('Starting PostgreSQL container...')
  execSync('docker compose up -d', { cwd, stdio: 'inherit' })
  await waitForPostgres(cwd)
}

async function waitForPostgres(cwd: string, maxAttempts = 30) {
  console.log('Waiting for PostgreSQL to be ready...')

  for (let i = 0; i < maxAttempts; i++) {
    try {
      execSync('docker compose exec -T postgres pg_isready -U postgres', {
        cwd,
        stdio: 'pipe',
      })
      console.log('PostgreSQL is ready')
      return
    } catch {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  throw new Error('PostgreSQL did not become ready in time')
}

export async function teardown() {
  // Don't stop the container - it may be reused
  // Container cleanup is manual via `pnpm db:stop` or `pnpm db:down`
}
