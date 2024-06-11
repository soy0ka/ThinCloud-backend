import 'dotenv/config'
import Formatter from '~/classes/ResponseFormat'
import TLSManager from '~/classes/TLSManager'
import express, { Request, Response } from 'express'

const app = express.Router()

app.post('/', async (req: Request, res: Response) => {
  const { url } = req.body
  if (!url) return res.status(400).send(Formatter.format(false, 'Bad Request')).end()
  const file = await TLSManager.Download(url as string)
  if (!file) return res.status(404).send(Formatter.format(false, 'Not Found')).end()
})

export default app
