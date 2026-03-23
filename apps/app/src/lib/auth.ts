import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
			role: string;
		};
	}
}

export const { handlers, signIn, signOut, auth } = NextAuth({
	adapter: PrismaAdapter(db),
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),
	],
	pages: {
		signIn: "/login",
	},
	callbacks: {
		async session({ session, user }) {
			if (session.user) {
				session.user.id = user.id;
				// Fetch role from database
				const dbUser = await db.user.findUnique({
					where: { id: user.id },
					select: { role: true },
				});
				session.user.role = dbUser?.role ?? "customer";
			}
			return session;
		},
	},
});
