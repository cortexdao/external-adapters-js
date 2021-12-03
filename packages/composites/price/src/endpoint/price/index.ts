import { Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Config } from '../../config'
import { convertUSDQuote, getTokenPrice } from '../../utils'
import * as beth from './beth'

export const supportedEndpoints = ['price']

export const inputParameters: InputParameters = {
  from: ['base', 'from', 'coin'],
  to: ['quote', 'to', 'market'],
  quoteDecimals: false,
  source: false,
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, inputParameters)
  if (validator.error) throw validator.error

  const { from, to, quoteDecimals } = validator.validated.data
  const fromUpperCase = from.toUpperCase()
  let taDecimals
  let priceExecute
  let intermediaryTokenSymbol
  switch (fromUpperCase) {
    case beth.FROM:
      taDecimals = beth.INTERMEDIARY_TOKEN_DECIMALS
      priceExecute = beth.execute
      intermediaryTokenSymbol = beth.INTERMEDIARY_TOKEN
      break
    default:
      throw Error(`Invalid from symbol ${fromUpperCase}`)
  }
  const taResponse = await getTokenPrice(input, context, intermediaryTokenSymbol, taDecimals)
  const resultInUSD = await priceExecute(input, context, config, taResponse)

  if (to === 'USD') return resultInUSD
  const convertedResult = await convertUSDQuote(
    input,
    context,
    resultInUSD.data.result,
    to,
    quoteDecimals,
  )
  return {
    jobRunID: input.id,
    statusCode: 200,
    result: convertedResult,
    data: {
      result: convertedResult,
    },
  }
}
