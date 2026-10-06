import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import request from 'supertest'
import { createApp } from '../src/app.js'

const env = {
  JWT_SECRET: 'test-secret-that-is-long-enough-for-validation',
  STAFF_USERNAME: 'staff',
  STAFF_PASSWORD: 'test-password',
}

function createTestApp() {
  const records = []
  const CaseRecord = {
    find() {
      return { sort: async () => [...records].sort((a, b) => b.firDate.localeCompare(a.firDate)) }
    },
    async create(record) {
      records.push(record)
      return record
    },
    async findOneAndUpdate({ id }, { $set: changes }) {
      const index = records.findIndex((record) => record.id === id)
      if (index === -1) return null
      records[index] = { ...records[index], ...changes }
      return records[index]
    },
  }
  return { app: createApp({ CaseRecord, env }), records }
}

describe('FIR Goshala API', () => {
  it('returns an empty public records list', async () => {
    const { app } = createTestApp()
    const response = await request(app).get('/api/records')
    assert.equal(response.status, 200)
    assert.deepEqual(response.body, [])
  })

  it('issues a staff token for valid credentials', async () => {
    const { app } = createTestApp()
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: env.STAFF_USERNAME, password: env.STAFF_PASSWORD })
    assert.equal(response.status, 200)
    assert.equal(typeof response.body.token, 'string')
  })

  it('rejects record writes without staff authentication', async () => {
    const { app } = createTestApp()
    const response = await request(app).post('/api/records').send({ id: 'FIR-1' })
    assert.equal(response.status, 401)
  })

  it('allows authenticated record creation', async () => {
    const { app, records } = createTestApp()
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: env.STAFF_USERNAME, password: env.STAFF_PASSWORD })
    const response = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ id: 'FIR-2026-1234', firNo: '123/2026' })

    assert.equal(response.status, 201)
    assert.equal(response.body.id, 'FIR-2026-1234')
    assert.equal(records.length, 1)
  })
})
