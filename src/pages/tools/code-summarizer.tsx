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
    </Head>
    <div className="min-h-screen bg-gray-50">
      <Header />
      <CodeSummarizer />
    </div>
    </>
  );
}
