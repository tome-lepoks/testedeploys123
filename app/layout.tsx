import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "CPF Brasil - Receita Federal",
  description: "Sistema de acesso ao CPF Brasil da Receita Federal",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Configuração UTMFY com tracking melhorado
              window.pixelId = "68230c0f5eee6a902ed7223a";
              
              // Função para capturar fbc (Facebook Click ID)
              function getFbc() {
                const fbcCookie = document.cookie
                  .split('; ')
                  .find(row => row.startsWith('_fbc='));
                return fbcCookie ? fbcCookie.split('=')[1] : null;
              }
              
              // Função para capturar fbp (Facebook Browser ID)
              function getFbp() {
                const fbpCookie = document.cookie
                  .split('; ')
                  .find(row => row.startsWith('_fbp='));
                return fbpCookie ? fbpCookie.split('=')[1] : null;
              }
              
              // Função para gerar event_id único
              function generateEventId(eventName) {
                const timestamp = Math.floor(Date.now() / 1000);
                const random = Math.floor(Math.random() * 1000);
                return \`\${eventName}-\${timestamp}\${random}\`;
              }
              
              // Função para hashear dados com SHA-256
              async function hashData(data) {
                const encoder = new TextEncoder();
                const dataBuffer = encoder.encode(data.toLowerCase().trim());
                const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
              }
              
              // Função para enviar evento de conversão melhorado
              window.trackConversion = async function(eventName, userData) {
                try {
                  // Gerar event_id único
                  const eventId = generateEventId(eventName);
                  
                  // Capturar dados do navegador
                  const fbc = getFbc();
                  const fbp = getFbp();
                  const eventSourceUrl = window.location.href;
                  const userAgent = navigator.userAgent;
                  
                  // Obter dados do servidor (IP, etc.)
                  let serverData = {};
                  try {
                    const serverResponse = await fetch('/api/track-conversion', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        eventName,
                        userData,
                        eventId
                      })
                    });
                    
                    if (serverResponse.ok) {
                      const serverResult = await serverResponse.json();
                      serverData = serverResult.serverData || {};
                    }
                  } catch (serverError) {
                    console.warn('[UTMFY] Erro ao obter dados do servidor:', serverError);
                  }
                  
                  // Preparar dados do usuário com hash
                  const hashedUserData = {};
                  if (userData.email) hashedUserData.em = await hashData(userData.email);
                  if (userData.phone) hashedUserData.ph = await hashData(userData.phone);
                  if (userData.firstName) hashedUserData.fn = await hashData(userData.firstName);
                  if (userData.lastName) hashedUserData.ln = await hashData(userData.lastName);
                  if (userData.city) hashedUserData.ct = await hashData(userData.city);
                  if (userData.state) hashedUserData.st = await hashData(userData.state);
                  if (userData.zip) hashedUserData.zp = await hashData(userData.zip);
                  if (userData.country) hashedUserData.country = await hashData(userData.country);
                  if (userData.externalId) hashedUserData.external_id = userData.externalId;
                  
                  // Adicionar dados de tracking (priorizar servidor)
                  hashedUserData.client_user_agent = serverData.client_user_agent || userAgent;
                  hashedUserData.client_ip_address = serverData.client_ip_address;
                  if (fbc) hashedUserData.fbc = fbc;
                  if (fbp) hashedUserData.fbp = fbp;
                  
                  // Enviar para UTMFY
                  const eventData = {
                    event_name: eventName,
                    event_time: Math.floor(Date.now() / 1000),
                    event_id: eventId,
                    event_source_url: serverData.event_source_url || eventSourceUrl,
                    action_source: "website",
                    user_data: hashedUserData
                  };
                  
                  console.log('[UTMFY] Enviando evento:', eventData);
                  
                  // Enviar via fetch para API UTMFY
                  const response = await fetch('https://api.utmify.com.br/api-credentials/events', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-api-token': 'IvzcwicXzvD9wEZvc3A8VCGJlxTfdz9J2gXq'
                    },
                    body: JSON.stringify(eventData)
                  });
                  
                  if (response.ok) {
                    console.log('[UTMFY] Evento enviado com sucesso');
                  } else {
                    console.error('[UTMFY] Erro ao enviar evento:', response.status);
                  }
                  
                  return eventId;
                } catch (error) {
                  console.error('[UTMFY] Erro no tracking:', error);
                  return null;
                }
              };
              
              // Carregar pixel UTMFY
              var a = document.createElement("script");
              a.setAttribute("async", "");
              a.setAttribute("defer", "");
              a.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel.js");
              document.head.appendChild(a);
            `,
          }}
        />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
      </body>
    </html>
  )
}