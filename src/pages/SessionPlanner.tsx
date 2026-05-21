import { Link } from 'react-router-dom'
import { Compass, ListChecks, MapPin, Shield, Sword, Users } from 'lucide-react'
import { useSessionPlanner } from '@/hooks/useSessionPlanner'
import type { SessionGoalKind } from '@/types/session-plan'

const goalIconByKind: Record<SessionGoalKind, React.ElementType> = {
  boss: Sword,
  build: Shield,
  wishlist: ListChecks,
  npc: Users,
  biome: MapPin,
}

const goalBadgeByKind: Record<SessionGoalKind, string> = {
  boss: 'Boss Focus',
  build: 'Build Focus',
  wishlist: 'Wishlist',
  npc: 'NPC Goal',
  biome: 'Biome Goal',
}

export default function SessionPlanner() {
  const plan = useSessionPlanner()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      <div className="mb-6 rounded-xl border border-terra-border bg-terra-surface p-5">
        <div className="flex items-start gap-3">
          <Compass className="mt-0.5 h-6 w-6 text-terra-gold" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Session Planner</p>
            <h1 className="mt-1 font-pixel text-sm text-terra-gold sm:text-base">{plan.headline}</h1>
            <p className="mt-2 text-sm text-gray-400">
              Quick plan generated from boss readiness, build stage, tracked drops, and nearby NPC/biome opportunities.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <SummaryTile label="Bosses" value={`${plan.summary.defeatedBosses}/${plan.summary.totalBosses}`} />
        <SummaryTile label="Prep Ready" value={`${plan.summary.prepReadyBosses}`} />
        <SummaryTile label="Build Gaps" value={`${plan.summary.missingBuildItems}`} />
        <SummaryTile label="Wishlist" value={`${plan.summary.wishedDrops}`} />
        <SummaryTile label="Goals" value={`${plan.goals.length}`} />
      </div>

      <div className="space-y-3">
        {plan.goals.map((goal, index) => {
          const Icon = goalIconByKind[goal.kind]

          return (
            <div key={goal.id} className="rounded-xl border border-terra-border bg-terra-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 text-terra-gold" />
                  <div>
                    <p className="text-xs text-gray-500">#{index + 1} · {goalBadgeByKind[goal.kind]}</p>
                    <h2 className="text-sm font-semibold text-white">{goal.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-gray-400">{goal.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-gray-500">Score</p>
                  <p className="text-sm font-semibold text-terra-gold">{goal.score.toFixed(1)}</p>
                </div>
              </div>
              <div className="mt-3">
                <Link
                  to={goal.route}
                  className="inline-flex items-center rounded border border-terra-border px-3 py-1.5 text-xs text-terra-sky transition-colors hover:border-terra-gold hover:text-terra-gold"
                >
                  Open Goal
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-terra-border bg-terra-surface p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-terra-gold">{value}</p>
    </div>
  )
}
