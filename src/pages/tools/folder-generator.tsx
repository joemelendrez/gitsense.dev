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
      </Head>

      <Header />
      <div className="pt-0"> {/* Account for fixed header */}
        <FolderStructureGenerator />
      </div>
    </>
  );
}