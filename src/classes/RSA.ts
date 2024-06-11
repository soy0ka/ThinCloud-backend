import forge from 'node-forge'

export const rsaEncrypt = (data: string) => {
  const publicKey = forge.pki.publicKeyFromPem(process.env.PUBLIC_KEY || '')
  const encrypted = publicKey.encrypt(data, 'RSAES-PKCS1-V1_5')
  return forge.util.encode64(encrypted)
}

export const rsaDecrypt = async (data: string) => {
  const encryptedKey = process.env.PRIVATE_KEY
  const passphrase = process.env.PRIVATE_KEY_PASSPHRASE

  if (!encryptedKey || !passphrase) return false
  const privateKey = await forge.pki.decryptRsaPrivateKey(encryptedKey, passphrase)
  const decrypted = privateKey.decrypt(forge.util.decode64(data), 'RSAES-PKCS1-V1_5')
  return decrypted
}
