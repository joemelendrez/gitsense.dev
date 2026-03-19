import React from 'react';
import Link from 'next/link';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import {
  Github,
  FolderTree,
  FileSearch,
  Shield,
  ScrollText,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Head from 'next/head';

export default function HomePage() {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Head>
          <title>
            GitSense.dev - Developer Intelligence Tools | Understand Any
            Codebase
          </title>
          <meta
            name="description"
            content="Developer tools that help you understand, analyze, and ship code faster. Repository intelligence, dependency auditing, codebase documentation, and more."
          />
        </Head>

        <Header />

        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Developer Intelligence Platform</span>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Understand Any Codebase
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {' '}
                in Minutes
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A suite of developer tools that save you hours. Analyze
              repositories, audit dependencies, generate documentation, and
              scaffold projects — so you can focus on shipping.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/auth/signup">
                <Button size="lg" className="px-8">
                  Get Started Free
                  <ArrowRight className="h-4 w-4 ml-2 inline" />
                </Button>
              </Link>
              <Link href="/tools/github-analyzer">
                <Button variant="outline" size="lg" className="px-8">
                  Try Repo Explorer
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Core Tools */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">
                Tools That Save You Hours
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Everything you need to understand, document, and maintain
                codebases — without the busywork.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Repo Explorer */}
              <Link
                href="/tools/github-analyzer"
                className="group p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <Github className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Repo Explorer</h3>
                <p className="text-gray-600 mb-3">
                  Instantly map any repository's structure, tech stack, and
                  architecture. Public and private repos supported.
                </p>
                <span className="text-blue-600 text-sm font-medium group-hover:underline">
                  Explore repos →
                </span>
              </Link>

              {/* Codebase Docs Generator */}
              <Link
                href="/tools/codebase-docs"
                className="group p-6 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all"
              >
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <FileSearch className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Codebase Docs Generator
                </h3>
                <p className="text-gray-600 mb-3">
                  Auto-generate onboarding docs, architecture guides, and
                  developer handbooks from any repository.
                </p>
                <span className="text-purple-600 text-sm font-medium group-hover:underline">
                  Generate docs →
                </span>
              </Link>

              {/* Dependency Auditor */}
              <Link
                href="/tools/dependency-auditor"
                className="group p-6 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all"
              >
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Dependency Auditor
                </h3>
                <p className="text-gray-600 mb-3">
                  Scan for vulnerable, outdated, or unmaintained dependencies.
                  Get actionable fix recommendations.
                </p>
                <span className="text-green-600 text-sm font-medium group-hover:underline">
                  Audit deps →
                </span>
              </Link>

              {/* Project Scaffolder */}
              <Link
                href="/tools/folder-generator"
                className="group p-6 rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all"
              >
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                  <FolderTree className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Project Scaffolder
                </h3>
                <p className="text-gray-600 mb-3">
                  Generate project structures from text descriptions. Download
                  ready-to-code scaffolds with framework templates.
                </p>
                <span className="text-orange-600 text-sm font-medium group-hover:underline">
                  Scaffold project →
                </span>
              </Link>

              {/* Changelog Generator */}
              <Link
                href="/tools/changelog-generator"
                className="group p-6 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all"
              >
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                  <ScrollText className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Changelog Generator
                </h3>
                <p className="text-gray-600 mb-3">
                  Turn commit history into polished changelogs and release notes.
                  Semantic versioning built in.
                </p>
                <span className="text-indigo-600 text-sm font-medium group-hover:underline">
                  Generate changelog →
                </span>
              </Link>

              {/* GitHub Analyzer (existing, rebranded) */}
              <div className="group p-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center">
                <Sparkles className="h-8 w-8 text-gray-400 mb-3" />
                <h3 className="text-lg font-semibold text-gray-500 mb-1">
                  More Coming Soon
                </h3>
                <p className="text-gray-400 text-sm">
                  PR Impact Analyzer, API Contract Extractor, and more on the
                  roadmap.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Value Props */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">2 min</div>
                <p className="text-gray-600">
                  Average time to fully map a repository's architecture
                </p>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  50%
                </div>
                <p className="text-gray-600">
                  Faster onboarding for new team members with generated docs
                </p>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">
                  24/7
                </div>
                <p className="text-gray-600">
                  Continuous dependency monitoring to catch vulnerabilities early
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-xl mx-auto">
              Start free. Upgrade when you need private repos, unlimited usage,
              and premium tools.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold mb-2">Free</h3>
                <p className="text-3xl font-bold mb-4">
                  $0<span className="text-lg text-gray-500">/month</span>
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>5 repo analyses per month</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Public repositories only</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Project Scaffolder</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Basic dependency scan</span>
                  </li>
                </ul>
                <Link href="/auth/signup">
                  <Button variant="outline" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>

              {/* Pro */}
              <div className="bg-blue-600 text-white rounded-xl p-6 transform scale-105 shadow-xl">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold">Pro</h3>
                  <span className="bg-blue-500 text-xs font-medium px-2 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
                <p className="text-3xl font-bold mb-4">
                  $19<span className="text-lg opacity-75">/month</span>
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-blue-200 mr-2 mt-1 flex-shrink-0" />
                    <span>Unlimited analyses</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-blue-200 mr-2 mt-1 flex-shrink-0" />
                    <span>Private repositories</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-blue-200 mr-2 mt-1 flex-shrink-0" />
                    <span>Codebase Docs Generator</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-blue-200 mr-2 mt-1 flex-shrink-0" />
                    <span>Changelog Generator</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-blue-200 mr-2 mt-1 flex-shrink-0" />
                    <span>Full Dependency Auditor</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-blue-200 mr-2 mt-1 flex-shrink-0" />
                    <span>Export & sharing</span>
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
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold mb-2">Team</h3>
                <p className="text-3xl font-bold mb-4">
                  $49<span className="text-lg text-gray-500">/month</span>
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Everything in Pro</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>API access</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Team workspace & sharing</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Priority support</span>
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
              <Github className="h-6 w-6" />
              <span className="text-xl font-bold">GitSense</span>
            </div>
            <p className="text-gray-400 mb-8">
              Developer intelligence tools that save you hours, not minutes.
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
    </>
  );
}
