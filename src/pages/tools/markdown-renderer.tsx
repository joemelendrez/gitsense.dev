import React from 'react';
import Head from 'next/head';
import { Header } from '../../components/layout/Header';
import { AdminGate } from '../../components/AdminGate';
import MarkdownRenderer from '../../components/tools/MarkdownRenderer';

export default function MarkdownRendererPage() {
  return (
    <AdminGate>
      <Head>
        <title>Markdown Renderer - GitSense.dev</title>
        <meta
          name="description"
          content="Create beautiful markdown documentation with live preview, rich text copying, and export options."
        />
        <link rel="canonical" href="https://gitsense.dev/tools/markdown-renderer" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />

        <main className="pt-20 pb-12">
          <MarkdownRenderer />
        </main>
      </div>
    </AdminGate>
  );
}
