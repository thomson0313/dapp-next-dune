// Packages
import React from "react";
import Document, { Html, Head, Main, NextScript, DocumentContext, DocumentInitialProps } from "next/document";
import Script from "next/script";

MyDocument.getInitialProps = async (ctx: DocumentContext): Promise<DocumentInitialProps & { nonce: string }> => {
  const initialProps = await Document.getInitialProps(ctx);

  const nonce = ctx.req?.headers?.["x-nonce"] as string;

  return {
    ...initialProps,
    nonce,
  };
};

export default function MyDocument({ nonce }: Readonly<{ nonce: string }>) {
  return (
    <Html lang='en'>
      <Head nonce={nonce}>
        <Script id='gtm' nonce={nonce} strategy='afterInteractive'>
          {`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
      `}
        </Script>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.__webpack_nonce__ = "${nonce}"`,
          }}
        />
        <meta name='msapplication-TileColor' content='#0B0E15' />
        <meta name='theme-color' content='#ffffff' />
        <meta property='og:type' content='website' />
        <meta property='og:image' content='/ithaca-og-image.png' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta property='twitter:domain' content='https://app.ithaca.finance/' />
        <meta name='twitter:image' content='/ithaca-og-image.png' />
        <meta name='twitter:card' content='summary_large_image' />
        <link rel='icon' href='/favicon/favicon.ico' />
        <link rel='apple-touch-icon' sizes='180x180' href='/favicon/apple-touch-icon.png' />
        <link rel='icon' type='image/png' sizes='32x32' href='/favicon/favicon-32x32.png' />
        <link rel='icon' type='image/png' sizes='16x16' href='/favicon/favicon-16x16.png' />
        <link rel='manifest' href='/site.webmanifest' />
        <link rel='mask-icon' href='/favicon/safari-pinned-tab.svg' color='#5bbad5' />
      </Head>
      <body>
        <noscript
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}" height="0" width="0" style="display: none; visibility: hidden;" />`,
          }}
        />
        <Main />
        <div id='portal' />
        <div id='datePicker' />
        <NextScript nonce={nonce} />
      </body>
    </Html>
  );
}
