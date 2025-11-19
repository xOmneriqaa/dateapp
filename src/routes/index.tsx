import { createFileRoute } from '@tanstack/react-router'
import { LandingHero } from '@/components/landing/LandingHero'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <LandingHero />
    </div>
  )
}
