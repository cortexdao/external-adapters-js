import { Validator, Logger, ExecuteWithConfig } from '@chainlink/ea-bootstrap'
import type { AdapterRequest, InputParameters } from '@chainlink/ea-bootstrap'
import { ethers, BigNumber } from 'ethers'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'
import { ExtendedConfig } from '../config'

export const NAME = 'TVL'
export const supportedEndpoints = [NAME]

export const description =
  'This endpoint fetches the TVL(Total Value Locked) inside a pair that is deployed on the XDai chain. The TVL is returned in USD.'

export type TInputParameters = {
  pairContractAddress: string
}

const inputParameters: InputParameters<TInputParameters> = {
  pairContractAddress: true,
}

const dxdWethContractAbi = [
  {
    type: 'function',
    stateMutability: 'view',
    payable: false,
    outputs: [
      {
        type: 'uint256',
        name: '',
      },
    ],
    name: 'balanceOf',
    inputs: [
      {
        type: 'address',
        name: '_owner',
      },
    ],
    constant: true,
  },
]

export const getTokenAllocations = async (
  request: AdapterRequest,
  config: ExtendedConfig,
): Promise<TokenAllocation.types.TokenAllocation[]> => {
  const validator = new Validator(request, inputParameters)

  const wethContractAddress = config.wethContractAddress
  const { pairContractAddress } = validator.validated.data
  const tvlInWei = await getTvlAtAddressInWei(
    pairContractAddress,
    wethContractAddress,
    config.RPC_URL,
  )
  return [
    {
      symbol: 'ETH', // Instead of querying the WETH price, get ETH price
      balance: tvlInWei.toString(),
      decimals: 18,
    },
  ]
}

const getTvlAtAddressInWei = async (
  pairContractAddress: string,
  wethContractAddress: string,
  jsonRpcUrl: string | undefined,
): Promise<BigNumber> => {
  const provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl)
  Logger.info(
    `Fetching TVL for contract '${pairContractAddress}' using WETH contract address ${wethContractAddress}`,
  )
  const contract = new ethers.Contract(wethContractAddress, dxdWethContractAbi, provider)
  const tvlInWei = (await contract.balanceOf(pairContractAddress)).mul(2)
  return tvlInWei
}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, context, config) => {
  const validator = new Validator<TInputParameters>(request, inputParameters)

  const jobRunID = validator.validated.id
  const allocations = await getTokenAllocations(request, config)
  const _execute = TokenAllocation.makeExecute()
  return await _execute({ id: jobRunID, data: { ...request.data, allocations } }, context)
}
