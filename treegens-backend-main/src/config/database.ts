import mongoose from 'mongoose'
import env from './environment'
import { runMigrations } from './migrations'

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI as string, {})

    console.log(`MongoDB Connected: ${conn.connection.host}`)

    // Run migrations after connection
    await runMigrations()
  } catch (error) {
    console.error('Database connection error:', error)
    process.exit(1)
  }
}

export default connectDB
