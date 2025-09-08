'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default function Header() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image
              src="/assets/startup-shell-logo-red-7a7fb14b.svg"
              alt="Startup Shell Logo"
              width={140}
              height={56}
              priority
              className="h-10 w-auto"
            />
          </div>
          
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-border hover:bg-accent"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}