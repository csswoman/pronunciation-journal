import PageLayout from '@/components/layout/PageLayout'
import PageHeader from '@/components/layout/PageHeader'
import GameCard from '@/components/practice/games/GameCard'
import UpcomingGamesPanel from '@/components/practice/games/UpcomingGamesPanel'
import { PRACTICE_GAMES } from '@/lib/practice/practice-games'

export const metadata = {
  title: 'Juegos',
  description:
    'Mecánicas ágiles para acelerar el reconocimiento y la retención de vocabulario en inglés',
}

export default function PracticeGamesPage() {
  return (
    <PageLayout archetype="catalog">
      <PageHeader
        kicker="Práctica rápida"
        title="Juegos"
        subtitle={`${PRACTICE_GAMES.length} juegos disponibles · mecánicas ágiles para reforzar tus reflejos en inglés`}
      />

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PRACTICE_GAMES.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>

        <UpcomingGamesPanel />
      </div>
    </PageLayout>
  )
}
