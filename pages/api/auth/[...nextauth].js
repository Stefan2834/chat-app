import NextAuth from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_ID,
      clientSecret: process.env.DISCORD_SECRET,
    }),
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET
    // })
    // ...add more providers here
  ],
  secret: process.env.SECRET_KEY
}

export default NextAuth(authOptions)