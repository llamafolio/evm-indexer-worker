import { OpenAPIRouter } from '@cloudflare/itty-router-openapi'

import {
  AddressERC20TokensBalances,
  AddressERC20TokensInteractions,
  AddressHistory,
  AddressInteraction,
  ChainBlock,
  ChainContract,
  ChainTransaction,
  Status,
  TokenHolders,
} from '@/handlers'
import { apiError } from '@/responses/responses'
import { Env } from '@/types'

const router = OpenAPIRouter({
  schema: {
    info: {
      title: 'EVM Indexer API',
      description: 'Showcase API for the EVM indexer.',
      version: '1.0',
    },
  },
})

router.original.get('/', (request) => Response.redirect(`${request.url}docs`, 302))

router
  .get('/status', Status)
  .get('/address/:address/history', AddressHistory)
  .get('/address/:address/interacted', AddressInteraction)
  .get('/address/:address/tokens', AddressERC20TokensInteractions)
  .get('/address/:address/balances', AddressERC20TokensBalances)
  .get('/chain/:chain/block/:block', ChainBlock)
  .get('/chain/:chain/contract/:contract', ChainContract)
  .get('/chain/:chain/tx/:hash', ChainTransaction)
  .get('/token/:chain/:token/holders', TokenHolders)

router.all('*', () => new Response('Not Found.', { status: 404 }))

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) =>
    router
      .handle(request, env, ctx)
      .then((response) => {
        return response
      })
      .catch((err) => {
        apiError(err, 500)
      }),
}
