import React from 'react'
import Link from 'next/link'
import { useAuthStore } from '../../store/auth'
import { Button } from '../ui/Button'
import { Code, Github, User, LogOut } from 'lucide-react'

export const Header: React.FC = () => {
  const { user, profile, signOut } = useAuthStore()

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Code className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">GitSense</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/tools/github-analyzer" className="text-gray-700 hover:text-primary-600">
              GitHub Analyzer
            </Link>
            <Link href="/tools/code-summarizer" className="text-gray-700 hover:text-primary-600">
              Code Summarizer
            </Link>
            <Link href="/dashboard" className="text-gray-700 hover:text-primary-600">
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  {profile?.full_name || user.email}
                </span>
                <span className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full">
                  {profile?.subscription_tier || 'free'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="p-2"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}