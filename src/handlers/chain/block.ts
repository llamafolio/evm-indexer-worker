import { Bool, Int, OpenAPIRoute, Path, Str } from '@cloudflare/itty-router-openapi'

import { getBlockByHash, getBlockByNumber } from '@/graph/fetchers'
import { apiError, apiSuccess } from '@/responses/responses'
import { Env } from '@/types'
import { isHex } from '@/utils'

export interface IBlock {
  base_fee_per_gas: string
  block_hash: string
  chain: string
  difficulty: string
  extra_data: string
  gas_limit: string
  gas_used: string
  logs_bloom: string
  miner: string
  mix_hash: string
  nonce: string
  number: number
  parent_hash: string
  receipts_root: string
  sha3_uncles: string
  size: number
  state_root: string
  timestamp: string
  total_difficulty: string
  transactions: number
  transactions_hashes: string[]
  uncles: string[]
}

export class ChainBlock extends OpenAPIRoute {
  static schema = {
    tags: ['Chain'],
    summary: 'Returns the block data from an specified chain.',
    parameters: {
      chain: Path(Str, {
        description: 'Chain to fetch the block.',
      }),
      block: Path(Str, {
        description: 'Block pointer (number or hash).',
      }),
    },
    responses: {
      '200': {
        schema: {
          success: new Bool({ example: true }),
          data: {
            base_fee_per_gas: new Str(),
            block_hash: new Str(),
            chain: new Str(),
            difficulty: new Str(),
            extra_data: new Str(),
            gas_limit: new Str(),
            gas_used: new Str(),
            logs_bloom: new Str(),
            miner: new Str(),
            mix_hash: new Str(),
            nonce: new Str(),
            number: new Int(),
            parent_hash: new Str(),
            receipts_root: new Str(),
            sha3_uncles: new Str(),
            size: new Int(),
            state_root: new Str(),
            timestamp: new Str(),
            total_difficulty: new Str(),
            transactions: new Int(),
            transactions_hashes: [new Str()],
            uncles: [new Str()],
          },
        },
      },
      '500': {
        schema: {
          success: new Bool({ example: false }),
          error: new Str({ example: 'block not found' }),
        },
      },
    },
  }

  async handle(request: Request, env: Env, ctx: any, data: Record<string, any>) {
    const { chain, block } = data

    let isBlockHash = false

    if (isHex(block)) {
      isBlockHash = true
    }

    const raw_blocks = []

    if (isBlockHash) {
      const { blocks } = await getBlockByHash(
        block,
        chain,
        {
          'x-hasura-admin-secret': env.HASURA_KEY,
        },
        env.HASURA_API_URL,
      )

      raw_blocks.push(...blocks)
    } else {
      const { blocks } = await getBlockByNumber(
        parseInt(block),
        chain,
        {
          'x-hasura-admin-secret': env.HASURA_KEY,
        },
        env.HASURA_API_URL,
      )

      raw_blocks.push(...blocks)
    }

    const blocks = raw_blocks.map((block) => ({
      base_fee_per_gas: block.base_fee_per_gas,
      block_hash: block.block_hash,
      chain: block.chain,
      difficulty: block.difficulty,
      extra_data: block.extra_data,
      gas_limit: block.gas_limit,
      gas_used: block.gas_used,
      miner: block.miner,
      mix_hash: block.mix_hash,
      nonce: block.nonce,
      number: block.number,
      parent_hash: block.parent_hash,
      receipts_root: block.receipts_root,
      sha3_uncles: block.sha3_uncles,
      size: block.size,
      state_root: block.state_root,
      timestamp: block.timestamp,
      total_difficulty: block.total_difficulty,
      transactions: block.transactions,
      transactions_hashes: block.transactions_data_aggregate?.nodes.map((tx) => tx.hash),
      uncles: block.uncles,
    }))

    if (blocks.length < 1) {
      return apiError('block not found', 400)
    }

    return apiSuccess(blocks[0])
  }
}
