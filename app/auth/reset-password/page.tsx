import { redirect } from 'next/navigation'

export default function AuthResetPasswordRedirect() {
  redirect('/reset-password')
}
