import 'dotenv/config'
import Auth from './Auth'
import express from 'express'

const app = express.Router()

app.use('/auth', Auth)
app.use('*', async (req, res) => {
  return res.status(200).send({ code: 200, message: 'V1 Alive' }).end()
})

export default app
