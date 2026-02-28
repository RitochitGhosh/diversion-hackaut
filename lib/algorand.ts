const INDEXER_BASE =
  process.env.ALGORAND_NETWORK === 'mainnet'
    ? 'https://mainnet-idx.algonode.cloud'
    : 'https://testnet-idx.algonode.cloud';

const MICROALGO_PER_ALGO = 1_000_000;

export interface AlgoVerifyResult {
  valid: boolean;
  sender?: string;
  amount?: number;
  error?: string;
}

export async function verifyAlgoPayment(
  txId: string,
  expectedAlgo: number,
  receiverAddress: string
): Promise<AlgoVerifyResult> {
  try {
    const res = await fetch(`${INDEXER_BASE}/v2/transactions/${txId.trim()}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    } as RequestInit);

    if (!res.ok) {
      if (res.status === 404) {
        return { valid: false, error: 'Transaction not found. It may still be pending — wait a few seconds and try again.' };
      }
      return { valid: false, error: `Indexer error: ${res.status}` };
    }

    const data = await res.json();
    const tx = data.transaction;

    if (!tx) {
      return { valid: false, error: 'Invalid response from Algorand indexer' };
    }

    if (tx['tx-type'] !== 'pay') {
      return { valid: false, error: 'Transaction is not a payment transaction (tx-type must be "pay")' };
    }

    const payTx = tx['payment-transaction'];
    if (!payTx) {
      return { valid: false, error: 'Missing payment transaction details' };
    }

    if (payTx.receiver !== receiverAddress) {
      return {
        valid: false,
        error: `Payment sent to wrong address. Expected: ${receiverAddress.slice(0, 8)}...`,
      };
    }

    const paidAlgo = payTx.amount / MICROALGO_PER_ALGO;
    if (paidAlgo < expectedAlgo - 0.01) {
      return {
        valid: false,
        error: `Insufficient payment: received ${paidAlgo.toFixed(3)} ALGO, need ${expectedAlgo} ALGO`,
      };
    }

    // Reject transactions older than 60 days
    const roundTime = tx['round-time'];
    if (roundTime) {
      const ageSeconds = Date.now() / 1000 - roundTime;
      if (ageSeconds > 60 * 24 * 3600) {
        return { valid: false, error: 'Transaction is too old (must be within 60 days)' };
      }
    }

    return { valid: true, sender: tx.sender, amount: paidAlgo };
  } catch (e) {
    console.error('[Algorand verify error]', e);
    return { valid: false, error: 'Failed to verify transaction. Check your network and try again.' };
  }
}
