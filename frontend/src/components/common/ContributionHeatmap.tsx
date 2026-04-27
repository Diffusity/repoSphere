import { useMemo, useState, useEffect, useRef } from 'react'
import { format, addDays, getDay } from 'date-fns'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { ContributionData } from '@/api/repo'

interface Props {
  data: ContributionData | undefined
  isLoading?: boolean
}

export function ContributionHeatmap({ data, isLoading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const { startDate, endDate, contributions, totalCommits } = useMemo(() => {
    if (!data || !data.startDate || !data.endDate) {
      return {
        startDate: format(addDays(new Date(), -364), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        contributions: {} as Record<string, number>,
        totalCommits: 0,
      }
    }
    return data
  }, [data])

  const allCells = useMemo(() => {
    const start = new Date(startDate)
    const startDayOfWeek = getDay(start)
    const items = []
    
    for (let i = 0; i < startDayOfWeek; i++) {
      items.push({ date: null, count: 0, level: 0 })
    }
    
    for (let i = 0; i <= 364; i++) {
      const currentDate = addDays(start, i)
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const count = contributions[dateStr] || 0
      
      let level = 0
      if (count === 1) level = 1
      else if (count >= 2 && count <= 3) level = 2
      else if (count >= 4 && count <= 6) level = 3
      else if (count >= 7) level = 4
      
      items.push({ date: currentDate, dateStr, count, level })
    }
    
    return items
  }, [startDate, contributions])

  const visibleWeeks = useMemo(() => {
    if (containerWidth === 0) return 53
    const availableWidth = containerWidth - 80
    const weeks = Math.floor(availableWidth / 12)
    return Math.max(1, Math.min(53, weeks))
  }, [containerWidth])

  const { cells, months } = useMemo(() => {
    const totalWeeks = 53
    const startIdx = (totalWeeks - visibleWeeks) * 7
    const slicedCells = allCells.slice(startIdx)
    
    const currentStart = addDays(new Date(startDate), (totalWeeks - visibleWeeks) * 7)
    const labels = []
    let current = currentStart
    let col = 0
    let lastMonth = current.getMonth()
    
    for (let i = 0; i < visibleWeeks; i++) {
      if (current.getMonth() !== lastMonth) {
        labels.push({ month: format(current, 'MMM'), col })
        lastMonth = current.getMonth()
      }
      current = addDays(current, 7)
      col++
    }

    return { cells: slicedCells, months: labels }
  }, [allCells, visibleWeeks, startDate])

  const getColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-[#0e4429]'
      case 2: return 'bg-[#006d32]'
      case 3: return 'bg-[#26a641]'
      case 4: return 'bg-[#39d353]'
      default: return 'bg-[#161b22]'
    }
  }

  if (isLoading) {
    return (
      <div className="w-full h-[180px] bg-rs-surface animate-pulse rounded-md border border-rs-border" />
    )
  }

  return (
    <div ref={containerRef} className="rounded-md border border-rs-border bg-rs-surface/50 p-6">
      <div className="flex flex-col gap-1 items-center"> {/* Center horizontally */}
        <div className="w-full overflow-x-auto pb-4 scrollbar-none">
          <div className="flex justify-center"> {/* Center the inner content */}
            <TooltipProvider delayDuration={0}>
              <div className="flex gap-3 min-w-max">
                <div className="grid grid-rows-7 gap-[2px] text-[11px] text-muted-foreground mt-6 pr-2">
                  <div className="h-[10px]" />
                  <div className="h-[10px] flex items-center leading-none">Mon</div>
                  <div className="h-[10px]" />
                  <div className="h-[10px] flex items-center leading-none">Wed</div>
                  <div className="h-[10px]" />
                  <div className="h-[10px] flex items-center leading-none">Fri</div>
                  <div className="h-[10px]" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="relative h-4 w-full text-[11px] text-muted-foreground">
                    {months.map(({ month, col }) => (
                      <span 
                        key={`${month}-${col}`} 
                        className="absolute transition-all duration-300" 
                        style={{ left: `${col * 12}px` }}
                      >
                        {month}
                      </span>
                    ))}
                  </div>
                  
                  <div className="grid grid-rows-7 grid-flow-col gap-[2px]">
                    {cells.map((cell, idx) => {
                      if (!cell.date) {
                        return <div key={`empty-${idx}`} className="w-[10px] h-[10px] rounded-[2px] opacity-0" />
                      }
                      return (
                        <Tooltip key={cell.dateStr}>
                          <TooltipTrigger asChild>
                            <div 
                              className={cn(
                                "w-[10px] h-[10px] rounded-[2px] cursor-default transition-all duration-100 hover:ring-1 hover:ring-white/40",
                                getColor(cell.level)
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent 
                            side="top" 
                            className="bg-[#161b22] border-rs-border border text-foreground text-[12px] px-3 py-1.5 shadow-2xl z-[100]"
                          >
                            <span className="font-semibold">{cell.count === 0 ? 'No' : cell.count}</span> {cell.count === 1 ? 'contribution' : 'contributions'} on {format(cell.date, 'MMM d, yyyy')}
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                </div>
              </div>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="flex w-full items-center justify-between text-[11px] text-muted-foreground mt-2 max-w-[800px]">
          <p>{totalCommits} contributions in the last year</p>
          <div className="flex items-center gap-[4px]">
            <span className="mr-1">Less</span>
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#161b22]" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#0e4429]" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#006d32]" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#26a641]" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#39d353]" />
            <span className="ml-1">More</span>
          </div>
        </div>
      </div>
    </div>
  )
}
