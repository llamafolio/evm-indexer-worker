import { Bool, OpenAPIRoute, Path, Str } from '@cloudflare/itty-router-openapi'

import { getContractInteracted } from '@/graph/fetchers'
import { apiError, apiSuccess } from '@/responses/responses'
import { Env } from '@/types'
import { isHex } from '@/utils'

export class AddressInteraction extends OpenAPIRoute {
  static schema = {
    tags: ['Address'],
    summary: 'Returns contracts and protocols name interacted with this address.',
    parameters: {
      address: Path(Str, {
        description: 'Address to fetch the interaction from',
      }),
    },
    responses: {
      '200': {
        schema: {
          success: new Bool({ example: true }),
          data: [
            {
              contract: new Str(),
              adapter: new Str(),
              chain: new Str(),
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

    const { transactions } = await getContractInteracted(
      address.toLowerCase(),
      {
        'x-hasura-admin-secret': env.HASURA_KEY,
      },
      env.HASURA_API_URL,
    )

    const interactions = transactions.map((transactions) => ({
      contract: transactions.contract_interacted.contract,
      adapter: transactions.contract_interacted.adapter?.adapter_id,
      chain: transactions.contract_interacted.chain,
    }))

    return apiSuccess(interactions)
  }
}
