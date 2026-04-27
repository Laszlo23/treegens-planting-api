'use client'

import { LeaderboardTopTabs } from '@/components/LeaderboardTopTabs'
import { Address } from '@/components/Address'
import { formatWeiToMgro } from '@/utils/formatWeiToMgro'

type FundedRow = {
  walletAddress: string
  totalBurnedMgroWei: string
}

const dummyRows: FundedRow[] = [
  {
    walletAddress: '0x4E3E5D6A7B8C9D0E1F2A3B4C5D6E7F8091A2B3C4',
    totalBurnedMgroWei: '4250000000000000000000',
  },
  {
    walletAddress: '0xAABBCCDDEEFF0011223344556677889900AABBCC',
    totalBurnedMgroWei: '980000000000000000000',
  },
  {
    walletAddress: '0x1234567890ABCDEF1234567890ABCDEF12345678',
    totalBurnedMgroWei: '150000000000000000000',
  },
]

function FundedTreesCard({ walletAddress, totalBurnedMgroWei }: FundedRow) {
  const burned = formatWeiToMgro(totalBurnedMgroWei)
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#e5e7eb] bg-white px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0">
          <Address
            address={walletAddress}
            className="truncate text-sm font-semibold text-[#111827]"
            blobbieSize={40}
          />
        </div>
      </div>
      <div className="text-right">
        <p className="text-base font-bold text-[#4d341e]">
          {burned.toLocaleString(undefined, { maximumFractionDigits: 2 })} MGRO
        </p>
      </div>
    </div>
  )
}

export default function LeaderboardFundedPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <LeaderboardTopTabs />
      <div className="flex flex-col gap-3">
        {dummyRows.map(row => (
          <FundedTreesCard key={row.walletAddress} {...row} />
        ))}
      </div>
    </div>
  )
}
