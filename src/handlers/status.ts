import { Bool, Int, OpenAPIRoute, Str } from '@cloudflare/itty-router-openapi'

import { getChainBlocks } from '@/graph/fetchers'
import { apiSuccess } from '@/responses/responses'
import { Env } from '@/types'

const ChainStatus = {
  chain: new Str(),
  indexed_blocks_amount: new Int(),
}

export class Status extends OpenAPIRoute {
  static schema = {
    tags: ['Status'],
    summary: 'Return the amount of indexed blocks for each available chain.',
    responses: {
      '200': {
        schema: {
          success: new Bool({ example: true }),
          data: [ChainStatus],
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

  async handle(request: Request, env: Env) {
    const chainsLastBlocksResponse = await getChainBlocks(
      {
        'x-hasura-admin-secret': env.HASURA_KEY,
      },
      env.HASURA_API_URL,
    )

    return apiSuccess(chainsLastBlocksResponse)
  }
}
