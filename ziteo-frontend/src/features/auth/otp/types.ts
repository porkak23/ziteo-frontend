// Puerto cliente para la emisión/prueba de OTP. El adaptador whatsapp es un
// no-op (el backend ya emitió el código al invocar register/resend/forgot-pin);
// el adaptador firebase ejecuta signInWithPhoneNumber y confirma el código
// localmente, produciendo un ID token que el backend verifica.
export interface ClientOtpProvider {
  readonly name: 'whatsapp' | 'firebase'
  /** Dispara el envío del código desde el cliente. No-op para whatsapp. */
  requestCode(phone: string): Promise<void>
  /** Convierte el código ingresado por el usuario en la "proof" que espera el backend. */
  getProof(code: string): Promise<string>
}
