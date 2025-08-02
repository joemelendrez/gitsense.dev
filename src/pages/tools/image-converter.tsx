// src/pages/tools/image-converter.tsx - Page with Layout & SEO
import React from 'react';
import Head from 'next/head';
import { Header } from '../../components/layout/Header';
import ImageConverter from '../../components/tools/ImageConverter';

export default function ImageConverterPage() {
  return (
    <>
      <Head>
        <title>Image to WebP Converter - GitSense.dev | Optimize Images for Web</title>
        <meta
          name="description"
          content="Convert PNG and JPG images to WebP format online. Reduce file sizes by up to 80% while maintaining quality. Perfect for web developers and performance optimization."
        />
        <meta
          name="keywords"
          content="webp converter, image compression, png to webp, jpg to webp, image optimization, web performance, developer tools"
        />
        
        {/* Open Graph */}
        <meta property="og:title" content="Image to WebP Converter - GitSense.dev" />
        <meta property="og:description" content="Convert images to WebP format online. Reduce file sizes by up to 80% for better web performance." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gitsense.dev/tools/image-converter" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Image to WebP Converter - GitSense.dev" />
        <meta name="twitter:description" content="Convert images to WebP format for better web performance." />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://gitsense.dev/tools/image-converter" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <Header />
        
        <main className="pt-20 pb-12">
          <ImageConverter />
        </main>
      </div>
    </>
  );
}