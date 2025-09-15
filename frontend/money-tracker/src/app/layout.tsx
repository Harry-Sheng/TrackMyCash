import type { Metadata } from "next"
import "./globals.css"
import { MantineProvider } from "@mantine/core"
import "@mantine/core/styles.css"
import "@mantine/charts/styles.css"

export const metadata: Metadata = {
  title: "Money Tracker",
  description: "One-page income & expense tracker",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <MantineProvider defaultColorScheme="light">{children}</MantineProvider>
      </body>
    </html>
  )
}
