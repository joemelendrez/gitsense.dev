import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Code } from 'lucide-react'
import toast from 'react-hot-toast'

interface ResetPasswordForm {
  password: string
  confirmPassword: string
}

export default function ResetPassword() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordForm>()
  const password = watch('password')

  const onSubmit = async (data: ResetPasswordForm) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })
      if (error) throw error
      toast.success('Password updated successfully!')
      router.push('/auth/signin')
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password')
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
            Set new password
          </h2>
          <p className="mt-2 text-gray-600">
            Enter your new password below.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              error={errors.password?.message}
            />

            <Input
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: value =>
                  value === password || 'Passwords do not match'
              })}
              error={errors.confirmPassword?.message}
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Update password
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
