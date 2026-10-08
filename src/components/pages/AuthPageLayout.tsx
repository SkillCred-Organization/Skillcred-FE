import type { ReactNode } from 'react'
import Logo from '../Logo'

type AuthPageLayoutProps = {
  children: ReactNode
}

export default function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#fff9f6] px-5 pb-12 pt-6 sm:pt-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-32 -z-10 size-80 rounded-full bg-[#ffe8d7] sm:-right-28 sm:-top-44 sm:size-[480px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -left-28 -z-10 size-72 rounded-full bg-[#e5f4d8] sm:-bottom-40 sm:-left-40 sm:size-[480px]"
      />
      <header className="mx-auto w-full max-w-6xl">
        <Logo />
      </header>
      <div className="mx-auto flex min-h-[calc(100vh-88px)] w-full items-center justify-center py-8">
        {children}
      </div>
    </main>
  )
}
