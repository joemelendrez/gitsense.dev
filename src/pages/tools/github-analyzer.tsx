import React from 'react';
import { Header } from '../../components/layout/Header';
import { GitHubAnalyzer } from '../../components/tools/GitHubAnalyzer';
import Head from 'next/head';

export default function GitHubAnalyzerPage() {
  return (
    <>
      <Head>
        <title>GitHub Repository Analyzer - GitSense.dev</title>
        <meta name="description" content="Analyze any GitHub repository structure for AI context. Extract directory trees, file counts, and project insights to optimize AI conversations." />
        <meta name="keywords" content="github analyzer, repository analysis, directory tree, code structure, AI context" />

        {/* Open Graph */}
        <meta property="og:title" content="GitHub Repository Analyzer - GitSense.dev" />
        <meta property="og:description" content="Analyze any GitHub repository structure for AI context and optimize AI conversations." />
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
