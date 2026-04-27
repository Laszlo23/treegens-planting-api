'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { FaClock } from 'react-icons/fa'
import { IPlantCard } from '@/types'

interface PlantCardProps {
  item: IPlantCard
}
export const PlantCard: React.FC<PlantCardProps> = ({ item }) => {
  const [clientTime, setClientTime] = useState<string | null>(null)

  useEffect(() => {
    setClientTime(item.date.toISOString())
  }, [item.date])
  return (
    <div className="flex flex-col gap-2.5 p-1 pb-2 rounded-xl  shadow-card">
      <div className="relative w-full aspect-video">
        <Image className="rounded-lg" src={item.image} alt={item.title} fill />
      </div>
      <div className="flex flex-col mx-1">
        <div className="flex justify-between">
          <p className="text-xs font-bold text-brown-1">
            {clientTime ?? 'Loading...'}
          </p>
          <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 rounded-full">
            <FaClock className="text-yellow-800" />
            <span className="text-xs font-medium text-yellow-800">
              {item.status}
            </span>
          </div>
        </div>
        <p className="text-xs text-brown-1">{item.title}</p>
      </div>
    </div>
  )
}
