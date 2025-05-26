import React from 'react';
import Link from 'next/link';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Code, Github, Zap, Users, Check } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Optimize Your Code for
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {' '}
              AI Conversations
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Save 80% on AI tokens while maintaining perfect context. Analyze any
            codebase in minutes and generate optimized summaries for ChatGPT,
            Claude, and more.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8">
                Get Started Free
              </Button>
            </Link>
            <Link href="/tools/github-analyzer">
              <Button variant="outline" size="lg" className="px-8">
                Try Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need for AI-Optimized Development
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <Github className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">GitHub Analyzer</h3>
              <p className="text-gray-600">
                Instantly understand any repository structure. Analyze public
                and private repos with intelligent depth control.
              </p>
            </div>
            <div className="text-center p-6">
              <Code className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Code Summarizer</h3>
              <p className="text-gray-600">
                Extract functions, classes, and key logic. Generate perfect AI
                context from any codebase.
              </p>
            </div>
            <div className="text-center p-6">
              <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">AI Enhancement</h3>
              <p className="text-gray-600">
                Get intelligent insights and recommendations. Optimize your
                prompts for better AI conversations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Simple, Transparent Pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <p className="text-3xl font-bold mb-4">
                $0<span className="text-lg text-gray-500">/month</span>
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  10 analyses per month
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Public repositories only
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Basic summaries
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                Get Started
              </Button>
            </div>

            {/* Pro */}
            <div className="bg-blue-600 text-white rounded-lg p-6 transform scale-105">
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <p className="text-3xl font-bold mb-4">
                $19<span className="text-lg opacity-75">/month</span>
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-blue-200 mr-2" />
                  Unlimited analyses
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-blue-200 mr-2" />
                  Private repositories
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-blue-200 mr-2" />
                  AI-enhanced summaries
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-blue-200 mr-2" />
                  Export options
                </li>
              </ul>
              <Button
                variant="secondary"
                className="w-full bg-white text-blue-600 hover:bg-gray-100"
              >
                Start Pro Trial
              </Button>
            </div>

            {/* Team */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-xl font-semibold mb-2">Team</h3>
              <p className="text-3xl font-bold mb-4">
                $49<span className="text-lg text-gray-500">/month</span>
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  API access
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Priority support
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Code className="h-6 w-6" />
            <span className="text-xl font-bold">GitSense</span>
          </div>
          <p className="text-gray-400 mb-8">
            Optimize your development workflow with AI-powered code analysis
          </p>
          <div className="flex justify-center space-x-8 text-sm">
            <Link href="/privacy" className="hover:text-gray-300">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-gray-300">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-gray-300">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
