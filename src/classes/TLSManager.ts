import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { PDFDocument } from 'pdf-lib'
import * as puppeteer from 'puppeteer'
import { Logger } from '~/utils/Logger'
import { v4 } from 'uuid'

export default class TLSManager {
  public static async Login (id: string, password: string) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    try {
      await page.goto('https://tls.kku.ac.kr/login.php')
      await page.type('#input-username', id)
      await page.type('#input-password', password)
      await page.click('#region-main > div > div > div > div.col-loginbox > div:nth-child(1) > div.col-login.col-login-person > form > div.submitform > input')
      await page.waitForNetworkIdle()
      await page.goto('https://tls.kku.ac.kr/user/user_edit.php?id=456394')

      const studentNumber = await page.$eval('#id_moodle > div > div:nth-child(1) > div.felement.fstatic', el => el.textContent)
      const name = await page.$eval('#id_firstname', el => el.getAttribute('value'))
      const major = await page.$eval('#id_moodle > div > div:nth-child(2) > div.felement.fstatic', el => el.textContent)
      return { studentNumber, name, major }
    } catch (e) {
      Logger.error('TLSManager').put('Login').put(e).out()
      return null
    }
  }

  public static async Download (url: string) {
    const Regex = /^https:\/\/tls\.kku\.ac\.kr\/local\/ubdoc\/\?.*$/
    if (!Regex.test(url)) return null
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    })
    const page = await browser.newPage()
    try {
      await page.goto(url, { waitUntil: 'networkidle2' })
      await page.waitForSelector('iframe#docFrame')

      const frameElement = await page.$('iframe#docFrame')
      if (!frameElement) throw new Error('Frame not found')
      const frame = await frameElement.contentFrame()
      if (!frame) throw new Error('Frame not found')

      const html = await frame.content()
      fs.writeFileSync('save.html', html, 'utf-8')
      await new Promise(resolve => setTimeout(resolve, 1500))
      const title = await frame.$eval('.fnm', el => el.textContent?.trim()) || 'unknown'
      const uuidPath = v4()
      const dirPath = path.join('./downloads', uuidPath)
      if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })

      const imgList = await frame.$$eval('#indexWrap > div', divs => divs.map((div) => {
        const img = div.querySelector('img')
        if (!img) return null
        return img.src
      }))
      if (!imgList) throw new Error('Image not found')
      Logger.log('TLSManager').put(`Donwloading file ${title}`)
      const savedImages = []
      const pdfDoc = await PDFDocument.create()
      for (let i = 0; i < imgList.length; i++) {
        const imgPath = path.join(dirPath, `${title}_${i}.png`)
        const writer = fs.createWriteStream(imgPath)

        const response = await axios.get(String(imgList[i]), { responseType: 'stream' })
        response.data.pipe(writer)

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve)
          writer.on('error', reject)
        })
        savedImages.push(imgPath)
      }
      Logger.success('TLSManager').put(`Downloaded ${title}`).next('path').put(dirPath).out()
      fs.writeFileSync(path.join(dirPath, 'image_url.txt'), imgList.join('\n'), 'utf-8')

      Logger.log('TLSManager').put('Creating PDF').next('title').put(title).out()
      for (const image of savedImages) {
        const img = await pdfDoc.embedPng(fs.readFileSync(image))
        const { width, height } = img.scale(0.5)
        const page = pdfDoc.addPage([width, height])
        page.drawImage(img, {
          x: 0,
          y: 0,
          width,
          height
        })
      }
      const pdfBytes = await pdfDoc.save()
      await fs.promises.writeFile(path.join(dirPath, title), pdfBytes)
      Logger.success('TLSManager').put('PDF Created').next('path').put(path.join(dirPath, title)).out()
      return { title, path: path.join(dirPath, title), url: uuidPath }
    } catch (e) {
      Logger.error('TLSManager').put('Download').put(e).out()
      return null
    }
  }
}
