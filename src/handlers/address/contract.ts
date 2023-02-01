import { Bool, Int, Obj, OpenAPIRoute, Path, Str } from '@cloudflare/itty-router-openapi'

import { getContracts } from '@/graph/fetchers'
import { apiError, apiSuccess } from '@/responses/responses'
import { Env } from '@/types'
import { isHex } from '@/utils'

export class AddressContract extends OpenAPIRoute {
  static schema = {
    tags: ['Address'],
    summary: 'Returns the contract information across all the chains for this address.',
    parameters: {
      address: Path(Str, {
        description: 'Address to fetch the contract data from',
      }),
    },
    responses: {
      '200': {
        schema: {
          success: new Bool({ example: true }),
          data: [
            {
              block: new Int(),
              chain: new Str(),
              contract: new Str(),
              creator: new Str(),
              hash: new Str(),
              protocol: new Str(),
              abi: Obj,
            },
          ],
        },
      },
      '500': {
        schema: {
          success: new Bool({ example: false }),
          error: new Str({ example: 'internal server error' }),
        },
      },
    },
  }

  async handle(request: Request, env: Env, ctx: any, data: Record<string, any>) {
    const { address } = data

    if (!isHex(address)) {
      return apiError('invalid address', 400)
    }

    const { contracts } = await getContracts(
      address.toLowerCase(),
      {
        'x-hasura-admin-secret': env.HASURA_KEY,
      },
      env.HASURA_API_URL,
    )

    const contractsData = contracts.map((contract) => {
      const contractData: {
        block: number
        chain: string
        contract: string
        creator: string
        hash: string
        abi?: any
        protocol?: string
      } = {
        block: contract.block,
        chain: contract.chain,
        contract: contract.contract,
        creator: contract.creator,
        hash: contract.hash,
      }

      if (contract.abi) {
        contractData.abi = JSON.parse(contract.abi.abi)
      }

      if (contract.adapter) {
        contractData.protocol = contract.adapter.adapter_id
      }

      return contractData
    })

    return apiSuccess(contractsData)
  }
}
