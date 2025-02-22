import { AdapterRequest } from '@chainlink/ea-bootstrap'
import * as process from 'process'
import { server as startServer } from '../../src'
import { mockETHBalanceResponseSuccess, mockETHBalanceAtBlockResponseSuccess } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const id = '1'
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
    ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || 'http://localhost:8545',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('with single address', () => {
    const data: AdapterRequest = {
      id,
      data: {
        result: [{ address: '0xEF9FFcFbeCB6213E5903529c8457b6F61141140d' }],
      },
    }

    it('should return success', async () => {
      mockETHBalanceResponseSuccess()

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

  describe('with multiple addresses', () => {
    const data: AdapterRequest = {
      id,
      data: {
        result: [
          { address: '0xEF9FFcFbeCB6213E5903529c8457b6F61141140d' },
          { address: '0x6a1544F72A2A275715e8d5924e6D8A017F0e41ed' },
        ],
      },
    }

    it('should return success', async () => {
      mockETHBalanceResponseSuccess()

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

  describe('with explicit minConfirmations', () => {
    const data: AdapterRequest = {
      id,
      data: {
        result: [{ address: '0x6a1544F72A2A275715e8d5924e6D8A017F0e41ed' }],
        minConfirmations: 20,
      },
    }

    it('should return success', async () => {
      mockETHBalanceAtBlockResponseSuccess()

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
