import 'dotenv/config'
import mongoose from 'mongoose'
import { createApp } from './app.js'
import CaseRecord from './models/CaseRecord.js'

const requiredEnvironment = ['MONGODB_URI', 'JWT_SECRET', 'STAFF_USERNAME', 'STAFF_PASSWORD']
const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name])

if (missingEnvironment.length) {
  console.error(`Missing required environment variables: ${missingEnvironment.join(', ')}`)
  process.exit(1)
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters long.')
  process.exit(1)
}

const port = Number(process.env.PORT || 4000)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be a valid TCP port number.')
  process.exit(1)
}

try {
  await mongoose.connect(process.env.MONGODB_URI)
  const app = createApp({ CaseRecord })
  app.listen(port, () => {
    console.log(`FIR Goshala API listening on port ${port}`)
  })
} catch (error) {
  console.error('Could not connect to MongoDB:', error.message)
  process.exit(1)
}
