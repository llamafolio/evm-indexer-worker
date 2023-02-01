import { Bool, Int, OpenAPIRoute, Path, Query, Str } from '@cloudflare/itty-router-openapi'

import { getTokensHolders } from '@/graph/fetchers'
import { apiError, apiSuccess } from '@/responses/responses'
import { Env } from '@/types'
import { isHex } from '@/utils'

export class TokenHolders extends OpenAPIRoute {
  static schema = {
    tags: ['Token'],
    summary: 'Returns the holders for a token.',
    parameters: {
      chain: Path(Str, {
        description: 'Chain to fetch the token from.',
      }),
      page: Query(Str, {
        description: 'Page number',
        default: '1',
        required: false,
      }),
      limit: Query(Int, {
        description: 'Amount of accounts to fetch',
        default: '50',
        required: false,
      }),
      token: Path(Str, {
        description: 'Address of the token.',
      }),
    },
    responses: {
      '200': {
        schema: {
          success: new Bool({ example: true }),
          data: {
            transactions: [{ address: Str, balance: Int }],
            total_pages: new Int({ example: 1 }),
            current_page: new Int({ example: 1 }),
            next_page: new Int({ example: 1 }),
            total_holders: new Int({ example: 10 }),
            total_supply: new Int({ example: 10 }),
          },
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
    const { chain, token, page, limit } = data

    if (!isHex(token)) {
      return apiError('invalid token address', 400)
    }

    const limitQuery = parseInt(limit) > 100 ? 100 : parseInt(limit)

    const pageQuery = (page === '0' ? 1 : parseInt(page)) ?? 1

    const offset = ((pageQuery - 1) * limitQuery).toFixed(0)

    const offsetNumber = parseInt(offset)

    const { erc20_balances, erc20_balances_aggregate } = await getTokensHolders(
      token.toLowerCase(),
      chain,
      limitQuery,
      offsetNumber,
      {
        'x-hasura-admin-secret': env.HASURA_KEY,
      },
    )

    const pages = parseInt((erc20_balances_aggregate.aggregate.count / limitQuery).toFixed(0))

    return apiSuccess({
      balances: erc20_balances,
      total_pages: pages,
      current_page: pageQuery >= pages ? pages : pageQuery,
      next_page: pageQuery >= pages ? pages : pageQuery + 1,
      total_holders: erc20_balances_aggregate.aggregate.count,
      total_supply: erc20_balances_aggregate.aggregate.sum.balance,
    })
  }
}
