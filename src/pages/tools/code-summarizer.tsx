import React from 'react';
import { Header } from '../../components/layout/Header';
import { AdminGate } from '../../components/AdminGate';
import { CodeSummarizer } from '../../components/tools/CodeSummarizer';
import Head from 'next/head';

export default function CodeSummarizerPage() {
  return (
    <AdminGate>
      <Head>
        <title>Code Summarizer - GitSense.dev</title>
        <meta name="description" content="Summarize code snippets and extract functions, classes, and key logic." />
        <link rel="canonical" href="https://gitsense.dev/tools/code-summarizer" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />

        <main className="pt-20 pb-12">
          <CodeSummarizer />
        </main>
      </div>
    </AdminGate>
  );
}
