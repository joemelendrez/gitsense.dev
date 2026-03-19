import React from 'react';
import Head from 'next/head';
import { Header } from '../../components/layout/Header';
import { AdminGate } from '../../components/AdminGate';
import ImageConverter from '../../components/tools/ImageConverter';

export default function ImageConverterPage() {
  return (
    <AdminGate>
      <Head>
        <title>Image to WebP Converter - GitSense.dev</title>
        <meta
          name="description"
          content="Convert PNG and JPG images to WebP format online. Reduce file sizes by up to 80% while maintaining quality."
        />
        <link rel="canonical" href="https://gitsense.dev/tools/image-converter" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <Header />

        <main className="pt-20 pb-12">
          <ImageConverter />
        </main>
      </div>
    </AdminGate>
  );
}
