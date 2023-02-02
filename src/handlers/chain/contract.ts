import { Bool, Int, Obj, OpenAPIRoute, Path, Str } from '@cloudflare/itty-router-openapi'

import { getContractForChain } from '@/graph/fetchers'
import { apiSuccess } from '@/responses/responses'
import { Env } from '@/types'

export interface IContract {
  block: number
  chain: string
  contract: string
  creator: string
  hash: string
  protocol?: string
  abi?: any
  name?: string
}

export class ChainContract extends OpenAPIRoute {
  static schema = {
    tags: ['Chain'],
    summary: 'Returns the contract data from an specified chain.',
    parameters: {
      chain: Path(Str, {
        description: 'Chain to fetch the block.',
      }),
      contract: Path(Str, {
        description: 'Address of the contract to fetch.',
      }),
    },
    responses: {
      '200': {
        schema: {
          success: new Bool({ example: true }),
          data: {
            block: new Int(),
            chain: new Str(),
            contract: new Str(),
            creator: new Str(),
            hash: new Str(),
            protocol: new Str(),
            abi: Obj,
          },
        },
      },
      '500': {
        schema: {
          success: new Bool({ example: false }),
          error: new Str({ example: 'contract not found' }),
        },
      },
    },
  }

  async handle(request: Request, env: Env, ctx: any, data: Record<string, any>) {
    const { chain, contract } = data

    const { contracts } = await getContractForChain(
      contract,
      chain,
      {
        'x-hasura-admin-secret': env.HASURA_KEY,
      },
      env.HASURA_API_URL,
    )

    if (contracts.length < 1) {
      return apiSuccess(undefined)
    }

    const contractData = contracts[0]

    const contractResponse: IContract = {
      block: contractData.block,
      chain: contractData.chain,
      contract: contractData.contract,
      creator: contractData.creator,
      hash: contractData.hash,
    }

    if (contractData.contract_information?.abi) {
      contractResponse.abi = JSON.parse(contractData?.contract_information.abi)
    }

    if (contractData.contract_information?.name) {
      contractResponse.name = contractData?.contract_information.name
    }

    return apiSuccess(contractResponse)
  }
}
