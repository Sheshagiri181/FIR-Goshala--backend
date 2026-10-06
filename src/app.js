import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import { timingSafeEqual } from 'node:crypto'

const localOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

function sameSecret(actual, expected) {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  )
}

function asyncRoute(handler) {
  return (request, response, next) =>
    Promise.resolve(handler(request, response, next)).catch(next)
}

export function createApp({ CaseRecord, env = process.env }) {
  const app = express()

  // --------------------------------------------------
  // CORS
  // --------------------------------------------------

  const allowedOrigins = [
    ...localOrigins,

    ...(env.WEB_ORIGIN || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ]

  app.disable('x-powered-by')

  app.use(helmet())

  app.use(
    cors({
      origin(origin, callback) {
        // Allow requests without an Origin header
        // (Postman, curl, server-to-server requests, etc.)
        if (!origin) {
          return callback(null, true)
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true)
        }

        return callback(new Error('Not allowed by CORS'))
      },
    })
  )

  app.use(express.json({ limit: '1mb' }))

  // --------------------------------------------------
  // HEALTH CHECK
  // --------------------------------------------------

  app.get('/api/health', (request, response) => {
    response.json({
      status: 'ok',
    })
  })

  // --------------------------------------------------
  // AUTH LOGIN
  // --------------------------------------------------

  app.post('/api/auth/login', (request, response) => {
    const { username, password } = request.body || {}

    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      typeof env.STAFF_USERNAME !== 'string' ||
      typeof env.STAFF_PASSWORD !== 'string' ||
      !sameSecret(username, env.STAFF_USERNAME) ||
      !sameSecret(password, env.STAFF_PASSWORD)
    ) {
      return response
        .status(401)
        .json({ error: 'Invalid username or password.' })
    }

    const token = jwt.sign(
      {
        sub: env.STAFF_USERNAME,
        role: 'staff',
      },
      env.JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: '8h',
      }
    )

    return response.json({
      token,
    })
  })

  // --------------------------------------------------
  // STAFF AUTHENTICATION MIDDLEWARE
  // --------------------------------------------------

  function requireStaff(request, response, next) {
    const authorization = request.get('authorization') || ''

    const match = authorization.match(/^Bearer\s+(.+)$/i)

    if (!match) {
      return response
        .status(401)
        .json({ error: 'Staff sign-in is required.' })
    }

    try {
      const claims = jwt.verify(match[1], env.JWT_SECRET, {
        algorithms: ['HS256'],
      })

      if (claims.role !== 'staff') {
        return response
          .status(403)
          .json({ error: 'Staff access is required.' })
      }

      return next()
    } catch {
      return response.status(401).json({
        error:
          'Staff session is invalid or expired. Please sign in again.',
      })
    }
  }

  // --------------------------------------------------
  // GET ALL RECORDS
  // --------------------------------------------------

  app.get(
    '/api/records',
    asyncRoute(async (request, response) => {
      const records = await CaseRecord.find().sort({
        firDate: -1,
      })

      response.json(records)
    })
  )

  // --------------------------------------------------
  // CREATE RECORD
  // --------------------------------------------------

  app.post(
    '/api/records',
    requireStaff,
    asyncRoute(async (request, response) => {
      if (
        !request.body ||
        typeof request.body !== 'object' ||
        Array.isArray(request.body)
      ) {
        return response.status(400).json({
          error: 'Request body must be a record object.',
        })
      }

      const record = await CaseRecord.create(request.body)

      response.status(201).json(record)
    })
  )

  // --------------------------------------------------
  // UPDATE RECORD
  // --------------------------------------------------

  app.put(
    '/api/records/:id',
    requireStaff,
    asyncRoute(async (request, response) => {
      if (
        !request.body ||
        typeof request.body !== 'object' ||
        Array.isArray(request.body)
      ) {
        return response.status(400).json({
          error: 'Request body must be a record object.',
        })
      }

      const { id, ...updates } = request.body

      const record = await CaseRecord.findOneAndUpdate(
        {
          id: request.params.id,
        },
        {
          $set: updates,
        },
        {
          new: true,
          runValidators: true,
          context: 'query',
        }
      )

      if (!record) {
        return response.status(404).json({
          error: 'FIR record not found.',
        })
      }

      response.json(record)
    })
  )

  // --------------------------------------------------
  // 404
  // --------------------------------------------------

  app.use((request, response) => {
    response.status(404).json({
      error: 'API route not found.',
    })
  })

  // --------------------------------------------------
  // ERROR HANDLER
  // --------------------------------------------------

  app.use((error, request, response, next) => {
    if (response.headersSent) {
      return next(error)
    }

    if (error?.type === 'entity.parse.failed') {
      return response.status(400).json({
        error: 'Request body must contain valid JSON.',
      })
    }

    if (error?.code === 11000) {
      return response.status(409).json({
        error: 'A record with this ID already exists.',
      })
    }

    if (
      error?.name === 'ValidationError' ||
      error?.name === 'CastError'
    ) {
      return response.status(400).json({
        error: error.message,
      })
    }

    console.error('API request failed:', error)

    return response.status(500).json({
      error: 'An unexpected server error occurred.',
    })
  })

  return app
}