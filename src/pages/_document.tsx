import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Primary Meta Tags */}
        <meta
          name="title"
          content="GitSense.dev - AI-Optimized Code Analysis & Repository Intelligence"
        />
        <meta
          name="description"
          content="Analyze GitHub repositories and code snippets for AI conversations. Save 80% on AI tokens with intelligent code summaries, repository structure analysis, and context optimization for ChatGPT, Claude, and more."
        />
        <meta
          name="keywords"
          content="github analyzer, code summarizer, AI code analysis, repository analysis, code intelligence, AI tokens, ChatGPT optimization, Claude optimization, developer tools, code context"
        />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="author" content="GitSense.dev" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gitsense.dev/" />
        <meta
          property="og:title"
          content="GitSense.dev - AI-Optimized Code Analysis"
        />
        <meta
          property="og:description"
          content="Analyze GitHub repositories and code snippets for AI conversations. Save 80% on AI tokens with intelligent summaries."
        />
        <meta property="og:image" content="https://gitsense.dev/og-image.png" />
        <meta property="og:site_name" content="GitSense.dev" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://gitsense.dev/" />
        <meta
          property="twitter:title"
          content="GitSense.dev - AI-Optimized Code Analysis"
        />
        <meta
          property="twitter:description"
          content="Analyze GitHub repositories and code snippets for AI conversations. Save 80% on AI tokens."
        />
        <meta
          property="twitter:image"
          content="https://gitsense.dev/twitter-image.png"
        />
        <meta property="twitter:creator" content="@gitsensedev" />

        {/* Additional Meta */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#3B82F6" />
        <link rel="canonical" href="https://gitsense.dev/" />

        {/* Favicons */}
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'GitSense.dev',
              description:
                'AI-optimized code analysis and repository intelligence platform',
              url: 'https://gitsense.dev',
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              creator: {
                '@type': 'Organization',
                name: 'GitSense.dev',
              },
            }),
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
