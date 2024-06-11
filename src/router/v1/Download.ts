import 'dotenv/config'
import Formatter from '~/classes/ResponseFormat'
import TLSManager from '~/classes/TLSManager'
import express, { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const app = express.Router()
const prisma = new PrismaClient()

app.post('/', async (req: Request, res: Response) => {
  const { url } = req.body
  if (!url) return res.status(400).send(Formatter.format(false, 'Bad Request')).end()
  const file = await TLSManager.Download(url as string)
  if (!file) return res.status(404).send(Formatter.format(false, 'Not Found')).end()
  const dbFile = await prisma.files.create({
    data: {
      name: file.title,
      path: file.path,
      url: file.url
    }
  })
  return res.status(200).send(Formatter.format(true, 'Success', dbFile)).end()
})

export default app
