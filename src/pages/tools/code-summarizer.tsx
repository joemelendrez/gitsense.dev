import React from 'react';
import { Header } from '../../components/layout/Header';
import { CodeSummarizer } from '../../components/tools/CodeSummarizer';
import Head from 'next/head';

export default function CodeSummarizerPage() {
  return (
    <>
      <Head>
        <title>Code Summarizer - AI Token Optimization - GitSense.dev</title>
        <meta name="description" content="Summarize code snippets for AI conversations. Extract functions, classes, and key logic while saving 80% on AI tokens." />
        <meta name="keywords" content="code summarizer, AI tokens, code analysis, function extraction, code optimization" />

        {/* Open Graph */}
        <meta property="og:title" content="Code Summarizer - GitSense.dev" />
        <meta property="og:description" content="Summarize code snippets for AI conversations and save 80% on AI tokens." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gitsense.dev/tools/code-summarizer" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Code Summarizer - GitSense.dev" />
        <meta name="twitter:description" content="Extract functions, classes, and key logic while saving 80% on AI tokens." />

        {/* Canonical URL */}
        <link rel="canonical" href="https://gitsense.dev/tools/code-summarizer" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />

        <main className="pt-20 pb-12">
          <CodeSummarizer />
        </main>
      </div>
    </>
  );
}
