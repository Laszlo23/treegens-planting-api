'use client'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useEffect, useState } from 'react'
import { LeaderboardItem } from '@/components/LeaderboardItem'
import { LeaderboardTopTabs } from '@/components/LeaderboardTopTabs'
import { useUser } from '@/contexts/UserProvider'
import { getLeaderboard } from '@/services/app'
import { ILeaderboardItem, ILeaderboardUser } from '@/types'

const ITEMS_PER_LOAD = 10

export default function LeaderBoard() {
  const [leaderboardData, setLeaderboardData] = useState<ILeaderboardItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const { user } = useUser()

  // Convert API response to component format
  const mapUserToLeaderboardItem = (
    user: ILeaderboardUser,
  ): ILeaderboardItem => ({
    id: user.rank,
    name: user.name || 'Anonymous',
    address: user.walletAddress,
    treesMounted: user.treesPlanted,
  })

  const fetchLeaderboard = async (
    page: number = 1,
    append: boolean = false,
  ) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getLeaderboard(
        page,
        ITEMS_PER_LOAD,
        user?.walletAddress,
      )
      const { users, pagination } = response.data.data

      const mappedUsers = users.map(mapUserToLeaderboardItem)

      if (append) {
        setLeaderboardData(prev => [...prev, ...mappedUsers])
      } else {
        setLeaderboardData(mappedUsers)
      }

      setCurrentPage(pagination.page)
      setTotalPages(pagination.pages)
      setHasMore(pagination.page < pagination.pages)
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setError('Failed to load leaderboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchLeaderboard(currentPage + 1, true)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    setLeaderboardData([])
    fetchLeaderboard()
  }, [])

  return (
    <div className="flex flex-col gap-4 p-6">
      <LeaderboardTopTabs />

      {loading && leaderboardData.length === 0 ? (
        <div className="flex justify-center items-center h-32">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button color="gray" onClick={() => fetchLeaderboard()}>
            Try Again
          </Button>
        </div>
      ) : leaderboardData.length > 0 ? (
        <>
          {/* Top performer */}
          {/* {leaderboardData[0] && (
            <LeaderboardItem
              className="rounded-2xl border-[2px] border-tree-green-1 bg-warm-grey"
              item={leaderboardData[0]}
            />
          )} */}

          <div className="border rounded-2xl border-warm-grey bg-warm-grey">
            {leaderboardData.map(item => (
              <LeaderboardItem
                key={item.id}
                item={item}
                className="border-b border-b-warm-grey-200 last:border-b-0"
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-4 mt-4">
              {/* Pagination Controls */}
              {
                /* Load More Button */
                hasMore && (
                  <div className="flex justify-center">
                    <Button
                      color="gray"
                      onClick={loadMore}
                      disabled={loading}
                      className="min-w-[120px] bg-warm-grey hover:bg-warm-grey-200 border-warm-grey-200 text-tree-green-1 font-medium"
                    >
                      {loading ? <Spinner size="sm" /> : 'Load More'}
                    </Button>
                  </div>
                )
              }

              {/* Page Info */}
              <div className="text-center text-sm text-warm-grey-400 font-medium">
                Page {currentPage} of {totalPages}
                {leaderboardData.length > 0 && (
                  <span> • Showing {leaderboardData.length} items</span>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No leaderboard data available</p>
        </div>
      )}
    </div>
  )
}
