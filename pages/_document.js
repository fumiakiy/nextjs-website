import Document, { Head, Main, NextScript } from 'next/document';
import React from 'react';

function Script() {
  const raw = `
  window.dataLayer = window.dataLayer || [];
  function gtag() {dataLayer.push(arguments); }
    gtag("js", new Date());

    gtag("config", "UA-50700-3");
 `
  return React.createElement("script", { dangerouslySetInnerHTML: { __html: raw } });
}

class CustomDocument extends Document {
  render() {
    return (
      <html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <meta httpEquiv="x-ua-compatible" content="ie=edge" />
          <script async src="https://www.googletagmanager.com/gtag/js?id=UA-50700-3"></script>
          <Script />
          <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
          <link rel="alternate" type="application/atom+xml" title="Atom feed for blog by Fumiaki Yoshimatsu" href="https://luckypines.com/feed.atom" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}

export default CustomDocument;