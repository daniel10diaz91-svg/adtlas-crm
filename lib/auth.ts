import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createServiceClient } from './supabase/service';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const supabase = createServiceClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
        if (error || !data.user) return null;
        const { data: dbUser } = await supabase
          .from('users')
          .select('tenant_id, name, role')
          .eq('id', data.user.id)
          .single();
        if (!dbUser) return null;
        const { data: tenant } = await supabase
          .from('tenants')
          .select('name')
          .eq('id', dbUser.tenant_id)
          .single();
        return {
          id: data.user.id,
          email: data.user.email!,
          name: dbUser.name ?? data.user.email!,
          tenantId: dbUser.tenant_id,
          tenantName: tenant?.name ?? 'My company',
          role: dbUser.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tenantId = (user as { tenantId?: string }).tenantId;
        token.tenantName = (user as { tenantName?: string }).tenantName;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { tenantId: string }).tenantId = token.tenantId as string;
        (session.user as { tenantName: string }).tenantName = (token.tenantName as string) ?? session.user.email ?? '';
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
};

declare module 'next-auth' {
  interface User {
    id: string;
    tenantId?: string;
    tenantName?: string;
    role?: string;
  }
  interface Session {
    user: User & { id: string; tenantId: string; tenantName: string; role: string };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    tenantId?: string;
    tenantName?: string;
    role?: string;
  }
}
