// src/pages/auth/verify-email.tsx
import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { Code, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function VerifyEmail() {
  return (
    <>
      <Head>
        <title>Verify Your Email - GitSense.dev</title>
        <meta
          name="description"
          content="Please check your email and click the verification link to activate your GitSense.dev account."
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div>
            <Link href="/" className="inline-flex items-center space-x-2 mb-6">
              <Code className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">
                GitSense.dev
              </span>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Check your email
              </h2>
              <p className="text-gray-600">
                We've sent a verification link to your email address. Please
                click the link to activate your account.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">What's next?</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Check your email inbox</li>
                  <li>2. Click the verification link</li>
                  <li>3. Sign in to your account</li>
                  <li>4. Start analyzing repositories!</li>
                </ol>
              </div>

              <div className="flex flex-col space-y-3">
                <Button
                  onClick={() => (window.location.href = 'mailto:')}
                  variant="outline"
                >
                  Open Email App
                </Button>

                <Link href="/auth/signin">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <p>Didn't receive the email? Check your spam folder or</p>
            <button className="text-blue-600 hover:text-blue-500">
              resend verification email
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
