import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Scroll, Shield, Sword, Eye, EyeOff, Check, X, KeyRound } from 'lucide-react';
import { z } from 'zod';

// Password strength requirements
const passwordRequirements = [
  { id: 'length', label: 'Pelo menos 8 caracteres', regex: /.{8,}/ },
  { id: 'uppercase', label: 'Uma letra maiúscula', regex: /[A-Z]/ },
  { id: 'lowercase', label: 'Uma letra minúscula', regex: /[a-z]/ },
  { id: 'number', label: 'Um número', regex: /[0-9]/ },
  { id: 'special', label: 'Um caractere especial (!@#$%^&*)', regex: /[!@#$%^&*(),.?":{}|<>]/ },
];

const emailSchema = z.string().trim().email('Email inválido').max(255, 'Email muito longo');

const createPasswordSchema = () => {
  return z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve ter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve ter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve ter pelo menos um número')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Senha deve ter pelo menos um caractere especial');
};

function PasswordStrengthIndicator({ password }: { password: string }) {
  const passedCount = passwordRequirements.filter(req => req.regex.test(password)).length;
  const strengthPercent = (passedCount / passwordRequirements.length) * 100;
  
  const getStrengthColor = () => {
    if (strengthPercent <= 20) return 'bg-destructive';
    if (strengthPercent <= 40) return 'bg-orange-500';
    if (strengthPercent <= 60) return 'bg-yellow-500';
    if (strengthPercent <= 80) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (strengthPercent <= 20) return 'Muito fraca';
    if (strengthPercent <= 40) return 'Fraca';
    if (strengthPercent <= 60) return 'Média';
    if (strengthPercent <= 80) return 'Forte';
    return 'Muito forte';
  };

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${strengthPercent}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground min-w-[80px]">
          {getStrengthLabel()}
        </span>
      </div>
      <ul className="space-y-1">
        {passwordRequirements.map((req) => {
          const passed = req.regex.test(password);
          return (
            <li key={req.id} className="flex items-center gap-2 text-xs">
              {passed ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <X className="w-3 h-3 text-muted-foreground" />
              )}
              <span className={passed ? 'text-green-500' : 'text-muted-foreground'}>
                {req.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Auth() {
  const [searchParams] = useSearchParams();
  const isResetMode = searchParams.get('mode') === 'reset';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(isResetMode);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const { signIn, signUp, user, resetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !resetPasswordMode) {
      navigate('/');
    }
  }, [user, navigate, resetPasswordMode]);

  useEffect(() => {
    setResetPasswordMode(isResetMode);
  }, [isResetMode]);

  const validateSignIn = () => {
    const emailResult = emailSchema.safeParse(email);
    const newErrors: typeof errors = {};
    
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignUp = () => {
    const emailResult = emailSchema.safeParse(email);
    const passwordSchema = createPasswordSchema();
    const passwordResult = passwordSchema.safeParse(password);
    const newErrors: typeof errors = {};
    
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignIn()) return;
    
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao entrar',
        description: error.message === 'Invalid login credentials' 
          ? 'Credenciais inválidas. Verifique seu email e senha.'
          : error.message,
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignUp()) return;
    
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);

    if (error) {
      const message = error.message.includes('already registered')
        ? 'Este email já está cadastrado. Tente fazer login.'
        : error.message;
      toast({
        variant: 'destructive',
        title: 'Erro ao criar conta',
        description: message,
      });
    } else {
      toast({
        title: 'Conta criada!',
        description: 'Verifique seu email para confirmar o cadastro.',
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailResult = emailSchema.safeParse(forgotEmail);
    
    if (!emailResult.success) {
      toast({
        variant: 'destructive',
        title: 'Email inválido',
        description: emailResult.error.errors[0].message,
      });
      return;
    }
    
    setForgotLoading(true);
    const { error } = await resetPassword(forgotEmail);
    setForgotLoading(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar email',
        description: error.message,
      });
    } else {
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
      setForgotPasswordOpen(false);
      setForgotEmail('');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordSchema = createPasswordSchema();
    const passwordResult = passwordSchema.safeParse(newPassword);
    
    if (!passwordResult.success) {
      toast({
        variant: 'destructive',
        title: 'Senha inválida',
        description: passwordResult.error.errors[0].message,
      });
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      toast({
        variant: 'destructive',
        title: 'Senhas diferentes',
        description: 'As senhas não coincidem.',
      });
      return;
    }
    
    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar senha',
        description: error.message,
      });
    } else {
      toast({
        title: 'Senha atualizada!',
        description: 'Sua senha foi alterada com sucesso.',
      });
      setResetPasswordMode(false);
      navigate('/');
    }
  };

  // Reset password form (when coming from email link)
  if (resetPasswordMode && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background parchment-texture p-4 dark">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary mb-4"
            >
              <KeyRound className="w-8 h-8 text-primary" />
            </motion.div>
            <h1 className="font-display text-3xl font-bold text-gold mb-2">
              Nova Senha
            </h1>
            <p className="text-muted-foreground">
              Defina sua nova senha de acesso
            </p>
          </div>

          <Card className="border-ornate bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-xl">Redefinir Senha</CardTitle>
              <CardDescription>
                Crie uma nova senha forte para sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={newPassword} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirm-new-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmNewPassword && newPassword !== confirmNewPassword && (
                    <p className="text-sm text-destructive">As senhas não coincidem</p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  className="w-full font-display glow-gold"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Salvar Nova Senha'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background parchment-texture p-4 dark">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary mb-4"
          >
            <Scroll className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-gold mb-2">
            RPG Master
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas campanhas épicas
          </p>
        </div>

        <Card className="border-ornate bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-xl">Bem-vindo, Mestre</CardTitle>
            <CardDescription>
              Entre ou crie sua conta para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="font-display">
                  <Shield className="w-4 h-4 mr-2" />
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup" className="font-display">
                  <Sword className="w-4 h-4 mr-2" />
                  Criar Conta
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="mestre@aventura.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={errors.email ? 'border-destructive' : ''}
                      autoComplete="email"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setForgotPasswordOpen(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full font-display glow-gold"
                    disabled={loading}
                  >
                    {loading ? 'Entrando...' : 'Entrar no Reino'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="mestre@aventura.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={errors.email ? 'border-destructive' : ''}
                      autoComplete="email"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <PasswordStrengthIndicator password={password} />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                    {confirmPassword && password === confirmPassword && (
                      <p className="text-sm text-green-500 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Senhas coincidem
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full font-display glow-gold"
                    disabled={loading}
                  >
                    {loading ? 'Criando conta...' : 'Iniciar Jornada'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Sua aventura aguarda, Mestre.
        </p>
      </motion.div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Recuperar Senha
            </DialogTitle>
            <DialogDescription>
              Digite seu email para receber um link de recuperação de senha.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="mestre@aventura.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setForgotPasswordOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={forgotLoading}>
                {forgotLoading ? 'Enviando...' : 'Enviar Email'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
