import { SupportedProtocolOptions } from "../monitor"

export interface MonitorResponse {
    isUp: boolean
    responseTime: number
    event: 'up' | 'down' | 'timeout' | 'error'
    error?: Error
    data?: any
    traceroute?: any
}

export class MonitorError extends Error {
    readonly response: MonitorResponse

    constructor(response: MonitorResponse, ...args: any[]) {
        super(...args)
        Error.captureStackTrace(this, MonitorError)
        Object.setPrototypeOf(this, MonitorError.prototype)
        this.response = response
    }
}

export interface MonitorHandler {
    ping(options: SupportedProtocolOptions): Promise<MonitorResponse>
}