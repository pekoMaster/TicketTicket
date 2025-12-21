import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Line from "next-auth/providers/line"
import Discord from "next-auth/providers/discord"
import { supabaseAdmin } from "@/lib/supabase"
import { INITIAL_SUPER_ADMIN } from "@/lib/auth-helpers"
import { UserRole } from "@/types"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Line({
      clientId: process.env.AUTH_LINE_ID,
      clientSecret: process.env.AUTH_LINE_SECRET,
    }),
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || !user.email) return true;

      try {
        // 檢查黑名單
        const { data: blacklisted } = await supabaseAdmin
          .from('blacklist')
          .select('id, reason')
          .eq('email', user.email)
          .single();

        if (blacklisted) {
          // 用戶被封鎖，拒絕登入
          console.log(`Blocked user attempted to login: ${user.email}`);
          return '/login?error=AccountBlocked';
        }

        // 檢查用戶是否已存在
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('provider', account.provider)
          .eq('provider_id', account.providerAccountId)
          .single();

        if (!existingUser) {
          // 新用戶，插入資料庫
          // 判斷角色：主管理員 email 自動設為 super_admin，其他為 user
          const role: UserRole = user.email === INITIAL_SUPER_ADMIN ? 'super_admin' : 'user';

          await supabaseAdmin.from('users').insert({
            email: user.email,
            username: user.name || user.email.split('@')[0],
            avatar_url: user.image,
            provider: account.provider,
            provider_id: account.providerAccountId,
            role,
          });
        } else {
          // 更新頭像和名稱
          await supabaseAdmin
            .from('users')
            .update({
              username: user.name || user.email.split('@')[0],
              avatar_url: user.image,
              updated_at: new Date().toISOString(),
            })
            .eq('provider', account.provider)
            .eq('provider_id', account.providerAccountId);
        }
      } catch (error) {
        console.error('Error syncing user to database:', error);
      }

      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.dbUserId) {
        session.user.dbId = token.dbUserId as string;
      }
      if (token.role) {
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;

        // 獲取資料庫中的用戶ID和角色
        try {
          const { data: dbUser } = await supabaseAdmin
            .from('users')
            .select('id, role')
            .eq('provider', account.provider)
            .eq('provider_id', account.providerAccountId)
            .single();

          if (dbUser) {
            token.dbUserId = dbUser.id;
            token.role = dbUser.role as UserRole;
          }
        } catch (error) {
          console.error('Error fetching user from database:', error);
        }
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
});
