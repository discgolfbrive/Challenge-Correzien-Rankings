import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, useGetMe } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Requis"),
  password: z.string().min(1, "Requis"),
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { data: me, isLoading } = useGetMe({ query: { retry: false } });
  const login = useLogin();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (me?.isAuthenticated) {
      setLocation("/admin/dashboard");
    }
  }, [me, setLocation]);

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    login.mutate({ data: values }, {
      onSuccess: () => {
        setLocation("/admin/dashboard");
      },
      onError: () => {
        toast({
          title: "Erreur",
          description: "Identifiants incorrects",
          variant: "destructive"
        });
      }
    });
  };

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-foreground font-bold uppercase tracking-widest">Chargement...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md border-4 border-foreground p-8 bg-card shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="mb-8 text-center border-b-2 border-border pb-6">
          <h1 className="text-3xl font-bold uppercase tracking-tight">Admin DGB</h1>
          <p className="text-muted-foreground uppercase tracking-widest mt-2 text-sm">Challenge Corrézien</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold uppercase tracking-wide">Identifiant</FormLabel>
                  <FormControl>
                    <Input {...field} className="border-2 rounded-none h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold uppercase tracking-wide">Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} className="border-2 rounded-none h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full rounded-none h-14 text-lg font-bold uppercase tracking-wider"
              disabled={login.isPending}
            >
              {login.isPending ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
