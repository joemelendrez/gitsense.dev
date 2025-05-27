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
    </Head>
    <div className="min-h-screen bg-gray-50">
      <Header />
      <GitHubAnalyzer />
    </div>
    </>
  );
}
