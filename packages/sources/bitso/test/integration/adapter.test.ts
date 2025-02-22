import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import { mockResponseSuccess, mockResponseFailure } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const id = '1'
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {}

  setupExternalAdapterTest(envVariables, context)
  describe('crypto api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'BTC',
        quote: 'ARS',
      },
    }

    it('should return success', async () => {
      mockResponseSuccess()

      const response = await context.req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('crypto api with invalid symbol', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'non',
        quote: 'existing',
      },
    }

    it('should return failure', async () => {
      mockResponseFailure()

      const response = await context.req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body).toMatchSnapshot()
    })
  })
})
