import { Bool, OpenAPIRoute, Path, Str } from '@cloudflare/itty-router-openapi'

import { getTokensBalances } from '@/graph/fetchers'
import { apiError, apiSuccess } from '@/responses/responses'
import { Env } from '@/types'
import { isHex } from '@/utils'

export class AddressERC20TokensBalances extends OpenAPIRoute {
  static schema = {
    tags: ['Address'],
    summary: 'Returns the ERC20 tokens balances.',
    parameters: {
      address: Path(Str, {
        description: 'Address to fetch the balances from',
      }),
    },
    responses: {
      '200': {
        schema: {
          success: new Bool({ example: true }),
          data: [
            {
              token: new Str(),
              balance: new Str(),
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

    const { erc20_balances } = await getTokensBalances(
      address.toLowerCase(),
      {
        'x-hasura-admin-secret': env.HASURA_KEY,
      },
      env.HASURA_API_URL,
    )

    const interactions = erc20_balances.map((balances) => ({
      token: balances.token,
      balance: balances.balance,
      chain: balances.chain,
      name: balances.token_details?.name,
      decimals: balances.token_details?.decimals,
      symbol: balances.token_details?.symbol,
    }))

    return apiSuccess(interactions)
  }
}
