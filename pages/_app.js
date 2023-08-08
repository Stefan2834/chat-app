import { SessionProvider } from "next-auth/react"
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Head from "next/head";
import Layout from "@/components/layout";


const theme = createTheme({
  typography: {
    fontFamily: 'Poppins, sans-serif', // Use the font family you imported
  },
});

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <ThemeProvider theme={theme}>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <SessionProvider session={session}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </SessionProvider>
    </ThemeProvider>
  )
}