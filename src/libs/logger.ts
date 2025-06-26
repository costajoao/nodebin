import { Logger } from '@nestjs/common'

const logger = (name: string = 'NodeBin') => new Logger(name)

export default logger
