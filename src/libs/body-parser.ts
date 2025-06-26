import express, { Request } from 'express'
import bodyParser from 'body-parser'
import Logger from './logger'
import yaml from 'js-yaml'
import xml2js from 'xml2js'
import * as parseEdn from 'edn-data'
import multer from 'multer'

const upload = multer()

const parseFile = (req: Request): string | null =>
  req?.files ? JSON.stringify(req.files, null, 2) : null

const parseMultipartFormData = (
  body: Buffer,
  contentType: string,
): Record<string, string> | null => {
  const boundary = contentType.match(/boundary=([^\s;]+)/)?.[1]
  if (!boundary) return null
  const parts = body
    .toString('utf8')
    .split(`--${boundary}`)
    .filter((p) => p.trim() && !p.includes('--'))
  const result: Record<string, string> = {}
  for (const part of parts) {
    const match = part.match(/name="([^"]+)"\r?\n\r?\n([\s\S]*)\r?\n?$/)
    if (match) {
      const [, name, value] = match
      result[name] = value.trim()
    }
  }

  return Object.keys(result).length ? result : null
}

const parseXml = async (body: string) => {
  try {
    const parsed = await xml2js.parseStringPromise(body, { explicitArray: false })
    return JSON.stringify(parsed, null, 2)
  } catch {
    return body
  }
}

const parseData = async (body: unknown, req?: Request): Promise<string | null> => {
  const logger = Logger('BodyParser')
  try {
    if (body == null || body === '') return null
    const contentType = req?.headers['content-type'] || ''

    if (Buffer.isBuffer(body)) {
      if (contentType.startsWith('text/')) return body.toString('utf8')
      return `<Buffer: ${body.length} bytes>`
    }

    if (contentType.startsWith('application/xml') || contentType.includes('xml')) {
      return parseXml(body as string)
    }

    if (contentType.startsWith('multipart/form-data')) {
      if (typeof body === 'object' && body !== null) {
        return JSON.stringify(body, null, 2)
      }
      if (typeof body === 'string') {
        const parsed = parseMultipartFormData(Buffer.from(body), contentType)
        return parsed ? JSON.stringify(parsed, null, 2) : body
      }
    }

    if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
      return JSON.stringify(body, null, 2)
    }

    if (typeof body === 'string') {
      if (contentType.includes('application/json')) {
        try {
          return JSON.stringify(JSON.parse(body), null, 2)
        } catch {
          return body
        }
      }
      if (contentType.includes('graphql')) return body
      if (contentType.includes('xml')) {
        // Note: parseXml is async, but parseData is sync. For full async, refactor parseBody.
        let parsed: string = body
        xml2js.parseString(body, { explicitArray: false }, (err, result) => {
          if (!err) parsed = JSON.stringify(result, null, 2)
        })
        return parsed
      }
      if (contentType.includes('yaml') || contentType.includes('yml')) {
        try {
          return JSON.stringify(yaml.load(body), null, 2)
        } catch {
          return body
        }
      }
      if (contentType.includes('edn')) {
        try {
          return JSON.stringify(parseEdn.parseEDNString(body), null, 2)
        } catch {
          return body
        }
      }
      if (contentType.includes('application/x-www-form-urlencoded')) {
        try {
          const params = new URLSearchParams(body)
          const obj: Record<string, string> = {}
          for (const [k, v] of params.entries()) obj[k] = v
          return JSON.stringify(obj, null, 2)
        } catch {
          return body
        }
      }
      if (contentType.startsWith('text/') || contentType === '') return body
      return body
    }
  } catch (err) {
    logger.error('Failed to parse body:', err)
  }
  return null
}

const parseBody = async (body: unknown, req?: Request): Promise<string | null> => {
  const fileResult = req ? parseFile(req) : null
  return fileResult !== null ? fileResult : parseData(body, req)
}

const router = express.Router()
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))
router.use(bodyParser.text({ type: 'text/plain' }))
router.use(bodyParser.raw({ type: '*.*' }))
router.use(upload.any())

router.use(async (req, _res, next) => {
  req.body = await parseBody(req.body, req)
  next()
})

export default router
