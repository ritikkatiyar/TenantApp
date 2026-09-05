import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';
import { Breakpoints, DarkColors, SansFont } from '@/src/theme/Theme';

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
        {/* Google Fonts: Playfair Display & Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,600;1,700&display=swap" rel="stylesheet" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root {
            background-color: ${DarkColors.background};
            min-height: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: ${SansFont};
          }
          @media (min-width: ${Breakpoints.desktop}px) {
            [data-responsive-layout="mobile"],
            [data-mobile-header="true"],
            [data-bottom-nav="true"] {
              display: none !important;
            }
          }
          @media (max-width: ${Breakpoints.desktop - 1}px) {
            [data-responsive-layout="desktop"] {
              display: none !important;
            }
            [data-mobile-header="true"],
            .mobile-header-container {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              z-index: 9999 !important;
            }
            [data-bottom-nav="true"],
            .mobile-bottom-nav-container {
              position: fixed !important;
              bottom: 20px !important;
              left: 0 !important;
              right: 0 !important;
              z-index: 9999 !important;
            }
          }
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
