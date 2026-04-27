import cn from 'classnames'
import Image from 'next/image'
import { ILeaderboardItem } from '@/types'
import { truncateAddress } from '@/utils/helpers'

interface LeaderboardItemProps {
  item: ILeaderboardItem
  className?: string
}
export const LeaderboardItem: React.FC<LeaderboardItemProps> = ({
  item,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2 p-3', className)}>
      <div className="flex gap-2 items-center w-40">
        <div className="relative shrink-0">
          <Image
            src={'/img/treegens-placeholder.svg'}
            alt="Treegens Logo"
            width={40}
            height={40}
          />
        </div>
        <div className="flex flex-col">
          <p className="text-xs font-semibold">{item.name}</p>
          <p className="text-xs">{truncateAddress(item.address)}</p>
        </div>
      </div>
      <div className="flex gap-1 justify-center items-center">
        <Image
          src={'/img/tree-outline.svg'}
          alt="Tree logo"
          width={24}
          height={24}
        />
        <span className="text-lg text-brown-1 font-semibold">
          {item.treesMounted}
        </span>
      </div>
      <div className="flex grow justify-end">
        <span className="text-sm text-lime-green-3 font-bold">#{item.id}</span>
      </div>
    </div>
  )
}
