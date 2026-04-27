#!/usr/bin/env ts-node
import mongoose from 'mongoose'
import env from '../config/environment'
import { runMigrations, rollbackMigration } from '../config/migrations'

const command = process.argv[2]

const main = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI as string, {})
    console.log('Connected to MongoDB')

    switch (command) {
      case 'up':
        await runMigrations()
        break
      case 'down':
        await rollbackMigration()
        break
      case 'status': {
        const Migration = mongoose.model(
          'Migration',
          new mongoose.Schema({
            version: String,
            appliedAt: Date,
            description: String,
          }),
        )
        const applied = await Migration.find().sort({ appliedAt: 1 })
        console.log('Applied migrations:')
        applied.forEach((m: any) => {
          console.log(
            `  ✅ ${m.version} - ${m.description} (${new Date(m.appliedAt).toISOString()})`,
          )
        })
        break
      }
      default:
        console.log('Usage: ts-node src/scripts/migrate.ts [up|down|status]')
        console.log('  up     - Run pending migrations')
        console.log('  down   - Rollback last migration')
        console.log('  status - Show migration status')
        break
    }

    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

main()
