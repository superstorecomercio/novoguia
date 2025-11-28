// Declaração de tipos para @socketlabs/email
// Este arquivo permite que o TypeScript reconheça o módulo mesmo que não esteja instalado

declare module '@socketlabs/email' {
  export class EmailAddress {
    constructor(email: string, friendlyName?: string)
    emailAddress: string
    friendlyName?: string
  }

  export class BasicMessage {
    subject: string
    htmlBody: string
    textBody?: string
    from: EmailAddress
    to: EmailAddress[]
    replyTo?: EmailAddress
    attachments?: any[]
    customHeaders?: any[]
    messageId?: string
    charSet?: string
    apiTemplate?: string
    mergeData?: any
  }

  export class SocketLabsClient {
    constructor(serverId: string, apiKey: string)
    send(message: BasicMessage): Promise<{
      transactionReceipt?: string
      messageId?: string
      errorCode?: string
      message?: string
    }>
  }
}


