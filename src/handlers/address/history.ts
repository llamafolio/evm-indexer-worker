import { Bool, OpenAPIRoute, Path, Query, Str } from '@cloudflare/itty-router-openapi'

import { getTransactionHistory } from '@/graph/fetchers'
import { apiError, apiSuccess } from '@/responses/responses'
import { Env } from '@/types'
import { isHex } from '@/utils'

export interface ITransaction {
  chain: string
  block_number: string
  timestamp: string
  hash: string
  from_address: string
  to_address: string
  gas_used: string
  gas_price: string
  input_function_name: string | undefined
  success: boolean
  adapter_id?: string | null
  token_transfers: {
    symbol?: string
    decimals?: number
    token_address: string
    from_address: string
    to_address: string
    value: string
  }[]
  value: string
}

export const TransactionSchema = {
  chain: new Str(),
  block_number: new Str(),
  timestamp: new Str(),
  hash: new Str(),
  from_address: new Str(),
  to_address: new Str(),
  gas_used: new Str(),
  gas_price: new Str(),
  input_function_name: new Str(),
  success: new Bool(),
  adapter_id: new Str(),
  token_transfers: [
    {
      token_address: new Str(),
      from_address: new Str(),
      to_address: new Str(),
      value: new Str(),
    },
  ],
  value: new Str(),
}

export class AddressHistory extends OpenAPIRoute {
  static schema = {
    tags: ['Address'],
    summary: 'Returns the transactions across all the chains sent or received by the specified address.',
    parameters: {
      address: Path(Str, {
        description: 'Address to fetch the transactions from',
      }),
      page: Query(Str, {
        description: 'Page number',
        default: '1',
        required: false,
      }),
      chains: Query(Str, {
        description: 'Comma separated list of chains to filter',
        default: '',
        required: false,
      }),
      protocols: Query(Str, {
        description: 'Comma separated list of protocols to filter',
        default: '',
        required: false,
      }),
    },
    responses: {
      '200': {
        schema: {
          success: new Bool({ example: true }),
          data: {
            transactions: [TransactionSchema],
            total_pages: new Str({ example: 1 }),
            current_page: new Str({ example: 1 }),
            next_page: new Str({ example: 1 }),
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
    const {
      address,
      page,
      chains: chainsFilters,
      protocols: protocolsFilters,
    } = data as {
      address: string
      page: string
      chains: string
      protocols: string
    }

    if (!isHex(address)) {
      return apiError('invalid address', 400)
    }

    let chains: string[] = []
    if (chainsFilters) {
      chains = chainsFilters.replace(/"/g, '').replace(/'/g, '').split(',') ?? []
    }

    let protocols: string[] = []

    if (protocolsFilters) {
      protocols = protocolsFilters.replace(/"/g, '').replace(/'/g, '').split(',') ?? []
    }

    const limit = 50

    const pageQuery = (page === '0' ? '1' : page) ?? '1'

    const offset = ((parseInt(pageQuery) - 1) * limit).toFixed(0)

    const offsetNumber = parseInt(offset)

    const { transactions, transactions_aggregate } = await getTransactionHistory(
      address.toLowerCase(),
      limit,
      offsetNumber,
      chains,
      protocols,
      {
        'x-hasura-admin-secret': env.HASURA_KEY,
      },
    )

    const pages = (transactions_aggregate.aggregate.count / limit).toFixed(0)

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
          name: token_transfer?.token_details?.name,
          symbol: token_transfer?.token_details?.symbol,
          decimals: token_transfer?.token_details?.decimals,
          token_address: token_transfer?.token,
          from_address: token_transfer?.from_address,
          to_address: token_transfer?.to_address,
          value: token_transfer?.value,
        })),
      }
    })

    return apiSuccess({
      transactions: transactionsData,
      total_pages: pages,
      current_page: pageQuery >= pages ? pages : pageQuery,
      next_page: pageQuery >= pages ? pages : (parseInt(pageQuery) + 1).toString(),
    })
  }
}
