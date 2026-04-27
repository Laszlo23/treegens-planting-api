/**
 * MGRO ABI (Base Sepolia deployment): minting uses mintTokens(receiver, amount).
 */
export const MGRO_ABI = [
  {
    inputs: [
      { internalType: 'address', name: '_receiver', type: 'address' },
      { internalType: 'uint256', name: '_tokens', type: 'uint256' },
    ],
    name: 'mintTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
