import {
  getBlockByHashQuery,
  getBlockByNumberQuery,
  getChainsIndexedStateQuery,
  getContractQuery,
  getContractsInteractedQuery,
  getTokensBalancesQuery,
  getTokensHoldersQuery,
  getTokensInteractedQuery,
  getTransactionHistoryQuery,
  getTransactionQuery,
} from './queries'
import {
  IIndexerBlock,
  IIndexerContract,
  IIndexerERC20TokenBalance,
  IIndexerERC20TokenInteractions,
  IIndexerInteractions,
  IIndexerTransaction,
} from './types'

const API_URL = 'https://graph.kindynos.mx/v1/graphql'

export const getChainBlocks = async (headers = {}): Promise<{ chain: string; indexed_blocks_amount: number }[]> => {
  const query = getChainsIndexedStateQuery()

  const res = await fetch(API_URL, {
    method: 'post',
    headers,
    body: JSON.stringify({ query }),
  })

  const { data }: any = await res.json()

  return data.chains_indexed_state
}

export const getTransactionHistory = async (
  address: string,
  limit: number,
  offset: number,
  chainsFilter: string[],
  protocolsFilter: string[],
  headers = {},
): Promise<{
  transactions: IIndexerTransaction[]
  transactions_aggregate: { aggregate: { count: number } }
}> => {
  const query = getTransactionHistoryQuery(address.toLowerCase(), limit, offset, chainsFilter, protocolsFilter)

  const res = await fetch(API_URL, {
    method: 'post',
    headers,
    body: JSON.stringify({ query }),
  })

  const { data }: any = await res.json()

  return data
}

export const getContractInteracted = async (
  address: string,
  headers = {},
): Promise<{
  transactions: IIndexerInteractions[]
}> => {
  const query = getContractsInteractedQuery(address.toLowerCase())

  const res = await fetch(API_URL, {
    method: 'post',
    headers,
    body: JSON.stringify({ query }),
  })

  const { data }: any = await res.json()

  return data
}

export const getTokensInteracted = async (
  address: string,
  headers = {},
): Promise<{
  erc20_transfers: IIndexerERC20TokenInteractions[]
}> => {
  const query = getTokensInteractedQuery(address.toLowerCase())

  const res = await fetch(API_URL, {
    method: 'post',
    headers,
    body: JSON.stringify({ query }),
  })

  const { data }: any = await res.json()

  return data
}

export const getTokensBalances = async (
  address: string,
  headers = {},
): Promise<{
  erc20_balances: IIndexerERC20TokenBalance[]
}> => {
  const query = getTokensBalancesQuery(address.toLowerCase())

  const res = await fetch(API_URL, {
    method: 'post',
    headers,
    body: JSON.stringify({ query }),
  })

  const { data }: any = await res.json()

  return data
}

export const getTokensHolders = async (
  token: string,
  chain: string,
  limit: number,
  offset: number,
  headers = {},
): Promise<{
  erc20_balances: { address: string; balance: string }[]
  erc20_balances_aggregate: { aggregate: { count: number; sum: { balance: number } } }
}> => {
  const query = getTokensHoldersQuery(token.toLowerCase(), chain, limit, offset)

  const res = await fetch(API_URL, {
    method: 'post',
    headers,
    body: JSON.stringify({ query }),
  })

  const { data }: any = await res.json()

  return data
}

export const getBlockByNumber = async (
  block: number,
  chain: string,
  headers = {},
): Promise<{
  blocks: IIndexerBlock[]
}> => {
  const query = getBlockByNumberQuery(chain, block)

  const res = await fetch(API_URL, {
    method: 'post',
    headers,
    body: JSON.stringify({ query }),
  })

  const { data }: any = await res.json()

  return data
}

export const getBlockByHash = async (
  block: string,
  chain: string,
  headers = {},
): Promise<{
  blocks: IIndexerBlock[]
}> => {
  const query = getBlockByHashQuery(chain, block)

  const res = await fetch(API_URL, {
    method: 'post',
    headers,
    body: JSON.stringify({ query }),
  })

  const { data }: any = await res.json()

  return data
}

export const getContract = async (
  contract: string,
  chain: string,
  headers = {},
): Promise<{
  contracts: IIndexerContract[]
}> => {
  const query = getContractQuery(chain, contract)

  const res = await fetch(API_URL, {
    method: 'post',
    headers,
    body: JSON.stringify({ query }),
  })

  const { data }: any = await res.json()

  return data
}

export const getTransaction = async (
  transaction: string,
  chain: string,
  headers = {},
): Promise<{
  transactions: IIndexerTransaction[]
}> => {
  const query = getTransactionQuery(chain, transaction)

  const res = await fetch(API_URL, {
    method: 'post',
    headers,
    body: JSON.stringify({ query }),
  })

  const { data }: any = await res.json()

  return data
}
