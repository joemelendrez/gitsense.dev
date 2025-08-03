// src/components/layout/Header.tsx - Fixed hover behavior
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../store/auth';
import { Button } from '../ui/Button';
import { Code, Github, LogOut, Menu, X, ChevronDown, Book, FolderTree,Image} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, profile, signOut } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  // In your Header.tsx, update the tools array:
const tools = [
  {
    name: 'GitHub Analyzer',
    href: '/tools/github-analyzer',
    icon: Github,
    description: 'Analyze repository structure',
  },
  {
    name: 'Code Summarizer',
    href: '/tools/code-summarizer',
    icon: Code,
    description: 'Optimize code for AI',
  },
  {
    name: 'Markdown Renderer',
    href: '/tools/markdown-renderer',
    icon: Book,
    description: 'Convert markdown to rich text',
  },
  {
    name: 'Folder Generator',           // NEW TOOL
    href: '/tools/folder-generator',    // NEW TOOL
    icon: FolderTree,                   // NEW TOOL (import from lucide-react)
    description: 'Generate project scaffolds', // NEW TOOL
  },
  {
    name: 'Image Converter',           // NEW TOOL
    href: '/tools/image-converter',    // NEW TOOL
    icon: Image,                   // NEW TOOL (import from lucide-react)
    description: 'Convert Image to WebP', // NEW TOOL
  }
];

  // Handle dropdown with proper timing
  const handleDropdownEnter = () => {
    setIsToolsDropdownOpen(true);
  };

  const handleDropdownLeave = () => {
    // Small delay to prevent flickering when moving between elements
    setTimeout(() => {
      setIsToolsDropdownOpen(false);
    }, 100);
  };

  const handleDropdownClick = () => {
    setIsToolsDropdownOpen(!isToolsDropdownOpen);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Code className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              GitSense.dev
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Tools Dropdown */}
            <div
              className="relative"
              onMouseEnter={handleDropdownEnter}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                onClick={handleDropdownClick}
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors py-2"
              >
                <span>Tools</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isToolsDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isToolsDropdownOpen && (
                <div className="absolute top-full left-0 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {tools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className="flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsToolsDropdownOpen(false)}
                    >
                      <tool.icon className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {tool.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {tool.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/pricing"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Pricing
            </Link>
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {profile?.full_name || user.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    {profile?.subscription_tier || 'free'}
                  </div>
                </div>
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
              <div className="flex items-center space-x-3">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-1">
              {/* Tools Section */}
              <div className="pb-3">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tools
                </div>
                {tools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <tool.icon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-xs text-gray-500">
                        {tool.description}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Navigation Links */}
              <div className="border-t border-gray-200 pt-3">
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/pricing"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
              </div>

              {/* Mobile Auth */}
              <div className="border-t border-gray-200 pt-3">
                {user ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2">
                      <div className="text-sm font-medium text-gray-900">
                        {profile?.full_name || user.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {profile?.subscription_tier || 'free'} plan
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        signOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-left text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/auth/signin"
                      className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="block px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
