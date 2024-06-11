import 'dotenv/config'
import express from 'express'
import Download from './Download'

const app = express.Router()

app.use('/download', Download)
app.use('*', async (req, res) => {
  return res.status(200).send({ code: 200, message: 'V1 Alive' }).end()
})

export default app
