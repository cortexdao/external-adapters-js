import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful calls', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { base: 'xSUSHI', quote: 'USD' } },
      },
      {
        name: 'base/quote',
        testData: { id: jobID, data: { base: 'xSUSHI', quote: 'USD' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest, {})
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).toBeGreaterThan(0)
        expect(data.data.result).toBeGreaterThan(0)
      })
    })
  })

  describe('error calls', () => {
    const requests = [
      {
        name: 'base not xSUSHI',
        testData: { id: jobID, data: { base: 'ETH', quote: 'USDT' } },
      },
      {
        name: 'unknown quote',
        testData: { id: jobID, data: { base: 'xSUSHI', quote: 'not_real' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
