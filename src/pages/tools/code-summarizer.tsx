import React from 'react';
import { Header } from '../../components/layout/Header';
import { CodeSummarizer } from '../../components/tools/CodeSummarizer';

export default function CodeSummarizerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <CodeSummarizer />
    </div>
  );
}
