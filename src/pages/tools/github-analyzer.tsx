import React from 'react';
import { Header } from '../../components/layout/Header';
import { GitHubAnalyzer } from '../../components/tools/GitHubAnalyzer';
import Head from 'next/head';

export default function GitHubAnalyzerPage() {
  return (
    <>
      <Head>
        <title>Repo Explorer - GitSense.dev | Understand Any Repository</title>
        <meta name="description" content="Instantly map any GitHub repository's structure, tech stack, and architecture. Analyze public and private repos with intelligent depth control." />
        <meta name="keywords" content="github analyzer, repository explorer, directory tree, code structure, repo intelligence" />

        {/* Open Graph */}
        <meta property="og:title" content="Repo Explorer - GitSense.dev" />
        <meta property="og:description" content="Instantly map any GitHub repository's structure, tech stack, and architecture." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gitsense.dev/tools/github-analyzer" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="GitHub Repository Analyzer - GitSense.dev" />
        <meta name="twitter:description" content="Analyze any GitHub repository structure for AI context." />

        {/* Canonical URL */}
        <link rel="canonical" href="https://gitsense.dev/tools/github-analyzer" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />

        <main className="pt-20 pb-12">
          <GitHubAnalyzer />
        </main>
      </div>
    </>
  );
}
