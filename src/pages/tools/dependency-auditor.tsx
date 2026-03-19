import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Shield, Check, ArrowRight } from 'lucide-react';

export default function DependencyAuditorPage() {
  return (
    <>
      <Head>
        <title>Dependency Auditor - GitSense.dev | Scan for Vulnerable Dependencies</title>
        <meta
          name="description"
          content="Scan your repositories for vulnerable, outdated, or unmaintained dependencies. Get actionable fix recommendations and license compliance checks."
        />
        <link rel="canonical" href="https://gitsense.dev/tools/dependency-auditor" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <Header />

        <main className="pt-20 pb-12 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-16">
              <div className="h-16 w-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Dependency Auditor
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                Know exactly what's in your dependency tree. Catch
                vulnerabilities, outdated packages, and license issues before
                they become problems.
              </p>
              <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 rounded-full px-4 py-2 text-sm font-medium">
                <span>Coming Soon — Free basic scan, Full audit on Pro</span>
              </div>
            </div>

            {/* What you get */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-12">
              <h2 className="text-2xl font-bold mb-6">What You'll Get</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Known vulnerability detection (CVE database)',
                  'Outdated package identification',
                  'Unmaintained dependency warnings',
                  'License compliance checks',
                  'Upgrade path recommendations',
                  'Risk severity scoring',
                  'package.json / requirements.txt / go.mod support',
                  'Exportable audit reports',
                ].map((item) => (
                  <div key={item} className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Get notified when this tool launches.
              </p>
              <Link href="/auth/signup">
                <Button size="lg" className="px-8">
                  Join Waitlist
                  <ArrowRight className="h-4 w-4 ml-2 inline" />
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
