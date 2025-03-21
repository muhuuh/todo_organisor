
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

type AuthFormProps = {
  type: 'sign-in' | 'sign-up';
  onSuccess?: () => void;
};

export function AuthForm({ type, onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === 'sign-up') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });

        if (error) throw error;

        toast.success('Sign up successful! Please check your email for confirmation.');
        navigate('/sign-in');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        toast.success('Signed in successfully!');
        if (onSuccess) onSuccess();
        navigate('/');
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
        console.error('Authentication error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-lg shadow-lg bg-card">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {type === 'sign-in' ? 'Sign In' : 'Sign Up'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={toggleShowPassword}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {type === 'sign-in' ? 'Signing In...' : 'Signing Up...'}
            </>
          ) : (
            type === 'sign-in' ? 'Sign In' : 'Sign Up'
          )}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        {type === 'sign-in' ? (
          <p>
            Don't have an account?{' '}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => navigate('/sign-up')}
            >
              Sign Up
            </Button>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => navigate('/sign-in')}
            >
              Sign In
            </Button>
          </p>
        )}
      </div>
    </div>
  );
}
