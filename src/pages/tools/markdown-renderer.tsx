// src/pages/tools/markdown-renderer.tsx - Page with Layout & SEO
import React from 'react';
import Head from 'next/head';
import { Header } from '../../components/layout/Header';
import MarkdownRenderer from '../../components/tools/MarkdownRenderer';

export default function MarkdownRendererPage() {
  return (
    <>
      <Head>
        <title>Markdown Renderer - GitSense.dev | AI-Optimized Documentation Tool</title>
        <meta
          name="description"
          content="Create beautiful markdown documentation optimized for AI conversations. Live preview, rich text copying, export options, and seamless integration with your development workflow."
        />
        <meta
          name="keywords"
          content="markdown renderer, documentation tool, AI-optimized, live preview, rich text copy, developer tools, GitSense"
        />
        
        {/* Open Graph */}
        <meta property="og:title" content="Markdown Renderer - GitSense.dev" />
        <meta property="og:description" content="Create beautiful markdown documentation optimized for AI conversations with live preview and rich text copying." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gitsense.dev/tools/markdown-renderer" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Markdown Renderer - GitSense.dev" />
        <meta name="twitter:description" content="Create beautiful markdown documentation optimized for AI conversations." />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://gitsense.dev/tools/markdown-renderer" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        
        <main className="pt-20 pb-12">
          <MarkdownRenderer />
        </main>
      </div>
    </>
  );
}