import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env.API_KEY = process.env.API_KEY ?? 'test_api_key'

  describe('successful calls', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { base: 'ETH', quote: 'USD' } },
      },
      {
        name: 'base/quote',
        testData: { id: jobID, data: { base: 'ETH', quote: 'USD' } },
      },
      {
        name: 'from/to',
        testData: { id: jobID, data: { from: 'ETH', to: 'USD' } },
      },
      {
        name: 'coin/market',
        testData: { id: jobID, data: { coin: 'ETH', market: 'USD' } },
      },
      {
        name: 'fsym/tsyms',
        testData: { id: jobID, data: { fsym: 'ETH', tsyms: 'USD' } },
      },
      {
        name: 'market cap',
        testData: {
          id: jobID,
          data: { base: 'ETH', quote: 'USD', endpoint: 'marketcap' },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).toBeGreaterThan(0)
        expect(data.data.result).toBeGreaterThan(0)
      })
    })
  })

  describe('successful batch calls', () => {
    const requests = [
      {
        name: 'multiple fsyms',
        testData: { id: jobID, data: { fsym: ['ETH', 'BTC'], tsyms: 'USD' } },
      },
      {
        name: 'skips pairs it cannot find',
        testData: { id: jobID, data: { base: ['BTC', 'EURT'], quote: ['USD', 'ARS'] } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(Object.keys(data.data.results).length).toBeGreaterThan(0)
      })
    })
  })

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'base not supplied',
        testData: { id: jobID, data: { quote: 'USD' } },
      },
      {
        name: 'quote not supplied',
        testData: { id: jobID, data: { base: 'ETH' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })

  describe('error calls', () => {
    const requests = [
      {
        name: 'unknown base',
        testData: { id: jobID, data: { base: 'not_real', quote: 'USD' } },
      },
      {
        name: 'unknown quote',
        testData: { id: jobID, data: { base: 'ETH', quote: 'not_real' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
