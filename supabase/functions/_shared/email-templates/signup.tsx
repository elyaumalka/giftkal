/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>אישור כתובת המייל שלך ב{siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>אישור כתובת המייל</Heading>
        <Text style={text}>
          תודה שנרשמת ל{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          נא לאשר את כתובת המייל שלך (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) בלחיצה על הכפתור:
        </Text>
        <Button style={button} href={confirmationUrl}>
          אישור המייל
        </Button>
        <Text style={footer}>
          אם לא נרשמת, אפשר להתעלם מהמייל הזה.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', textAlign: 'right' as const, fontFamily: 'Assistant, Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#051839',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#4a5568',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: '#051839',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '14px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
