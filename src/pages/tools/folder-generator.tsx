// src/pages/tools/folder-generator.tsx
import React from 'react';
import { Header } from '../../components/layout/Header';
import FolderStructureGenerator from '../../components/tools/FolderStructureGenerator';
import Head from 'next/head';

export default function FolderGeneratorPage() {
  return (
    <>
      <Head>
        <title>Folder Structure Generator - GitSense.dev | Project Scaffolding Tool</title>
        <meta
          name="description"
          content="Convert text-based folder structures into downloadable project scaffolds. Perfect for setting up new React, Next.js, and development projects."
        />
        <meta
          name="keywords"
          content="folder structure generator, project scaffolding, directory generator, file structure, developer tools"
        />

        {/* Open Graph */}
        <meta property="og:title" content="Folder Structure Generator - GitSense.dev" />
        <meta property="og:description" content="Convert text-based folder structures into downloadable project scaffolds." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gitsense.dev/tools/folder-generator" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Folder Structure Generator - GitSense.dev" />
        <meta name="twitter:description" content="Convert text-based folder structures into downloadable project scaffolds." />

        {/* Canonical URL */}
        <link rel="canonical" href="https://gitsense.dev/tools/folder-generator" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />

        <main className="pt-20 pb-12">
          <FolderStructureGenerator />
        </main>
      </div>
    </>
  );
}