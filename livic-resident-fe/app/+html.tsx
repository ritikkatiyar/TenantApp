import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function HTML({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Preconnect to API and AI services */}
        <link rel="preconnect" href="https://tenantappbackend.onrender.com" />
        <link rel="preconnect" href="https://ai-service-ws9z.onrender.com" />
        <link rel="dns-prefetch" href="https://tenantappbackend.onrender.com" />
        <link rel="dns-prefetch" href="https://ai-service-ws9z.onrender.com" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          @media (min-width: 900px) {
            [data-responsive-layout="mobile"],
            [data-mobile-header="true"],
            [data-bottom-nav="true"] {
              display: none !important;
            }
          }
          @media (max-width: 899px) {
            [data-responsive-layout="desktop"] {
              display: none !important;
            }
          }
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
