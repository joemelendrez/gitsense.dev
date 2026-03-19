import React, { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Code } from 'lucide-react'
import toast from 'react-hot-toast'

interface ForgotPasswordForm {
  email: string
}

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>()

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      setSubmitted(true)
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <Code className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">GitSense</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-gray-600">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
              <p className="text-sm text-gray-600">
                If an account exists with that email, we&apos;ve sent a password reset link. Check your inbox and spam folder.
              </p>
              <Link
                href="/auth/signin"
                className="inline-block text-sm text-blue-600 hover:text-blue-500"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                error={errors.email?.message}
              />

              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >
                Send reset link
              </Button>

              <div className="text-center">
                <Link href="/auth/signin" className="text-sm text-blue-600 hover:text-blue-500">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
