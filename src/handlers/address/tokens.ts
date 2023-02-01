import { Bool, OpenAPIRoute, Path, Str } from '@cloudflare/itty-router-openapi'

import { getTokensInteracted } from '@/graph/fetchers'
import { apiError, apiSuccess } from '@/responses/responses'
import { Env } from '@/types'
import { isHex } from '@/utils'

export class AddressERC20TokensInteractions extends OpenAPIRoute {
  static schema = {
    tags: ['Address'],
    summary: 'Returns ERC20 tokens interacted with this address.',
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
              token: new Str(),
              decimals: new Str(),
              chain: new Str(),
              name: new Str(),
              symbol: new Str(),
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

    const { erc20_transfers } = await getTokensInteracted(
      address.toLowerCase(),
      {
        'x-hasura-admin-secret': env.HASURA_KEY,
      },
      env.HASURA_API_URL,
    )

    const interactions = erc20_transfers.map((transactions) => ({
      token: transactions.token_details.address,
      decimals: transactions.token_details.decimals,
      symbol: transactions.token_details.symbol,
      chain: transactions.token_details.chain,
      name: transactions.token_details.name,
    }))

    return apiSuccess(interactions)
  }
}
