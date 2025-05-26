import React from 'react';
import { Header } from '../../components/layout/Header';
import { GitHubAnalyzer } from '../../components/tools/GitHubAnalyzer';

export default function GitHubAnalyzerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <GitHubAnalyzer />
    </div>
  );
}
