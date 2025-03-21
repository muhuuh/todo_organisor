
import { AuthForm } from '@/components/auth/AuthForm';

export default function SignUp() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">Task Manager</h1>
        <p className="text-center text-muted-foreground mb-8">
          Create an account to get started
        </p>
        <AuthForm type="sign-up" />
      </div>
    </div>
  );
}
