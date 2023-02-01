import { Bool, OpenAPIRoute, Path, Str } from '@cloudflare/itty-router-openapi'

import { getTransaction } from '@/graph/fetchers'
import { apiError, apiSuccess } from '@/responses/responses'
import { Env } from '@/types'

import { ITransaction, TransactionSchema } from '../address'

export class ChainTransaction extends OpenAPIRoute {
  static schema = {
    tags: ['Chain'],
    summary: 'Returns the transaction data from an specified chain.',
    parameters: {
      chain: Path(Str, {
        description: 'Chain to fetch the block.',
      }),
      hash: Path(Str, {
        description: 'Transaction hash to fetch.',
      }),
    },
    responses: {
      '200': {
        schema: {
          success: new Bool({ example: true }),
          data: TransactionSchema,
        },
      },
      '500': {
        schema: {
          success: new Bool({ example: false }),
          error: new Str({ example: 'transaction not found' }),
        },
      },
    },
  }

  async handle(request: Request, env: Env, ctx: any, data: Record<string, any>) {
    const { chain, hash } = data

    const { transactions } = await getTransaction(
      hash,
      chain,
      {
        'x-hasura-admin-secret': env.HASURA_KEY,
      },
      env.HASURA_API_URL,
    )

    const transactionsData: ITransaction[] = transactions.map((tx) => {
      let chain = tx.chain

      // Special cases to match the indexer chain name

      if (chain === 'mainnet') {
        chain = 'ethereum'
      }

      if (chain === 'avalanche') {
        chain = 'avax'
      }

      return {
        chain,
        block_number: tx.block_number,
        timestamp: tx.timestamp,
        hash: tx.hash,
        from_address: tx.from_address,
        to_address: tx.to_address,
        gas_used: tx.gas,
        gas_price: tx.gas_price,
        input_function_name: tx.method_name?.name,
        success: tx.receipts?.status === '1',
        adapter_id: tx.contract_interacted?.adapter?.adapter_id,
        value: tx.value,
        token_transfers: tx.token_transfers_aggregate.nodes.map((token_transfer) => ({
          symbol: token_transfer?.token_details?.symbol,
          decimals: token_transfer?.token_details?.decimals,
          token_address: token_transfer?.token,
          from_address: token_transfer?.from_address,
          to_address: token_transfer?.to_address,
          value: token_transfer?.value,
        })),
      }
    })

    if (transactions.length < 1) {
      return apiError('transaction not found', 400)
    }

    return apiSuccess(transactionsData[0])
  }
}
