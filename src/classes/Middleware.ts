// import { Logger } from '../utils/Logger'
import Formatter from './ResponseFormat'
import { Logger } from '../utils/Logger'
import firebaseAdmin from 'firebase-admin'
import { Request, Response, NextFunction } from 'express'
import { applicationDefault, initializeApp } from 'firebase-admin/app'

export default class MiddleWare {
  private static firebaseApp = initializeApp({ credential: applicationDefault() })
  public static async verify (req: Request, res: Response, next: NextFunction) {
    const appCheckToken = req.header('X-Firebase-AppCheck')
    if (!appCheckToken) return res.status(401).json(Formatter.format(false, 'Invalid Token')).end()
    try {
      const result = await firebaseAdmin.appCheck().verifyToken(appCheckToken).catch(() => false)
      if (!result) return res.status(401).json(Formatter.format(false, 'Invalid Token')).end()
      next()
    } catch (error:any) {
      Logger.error(error.name).put(error.stack).out()
      return res.status(401).json(Formatter.format(false, 'Invalid Token')).end()
    }
  }
}
