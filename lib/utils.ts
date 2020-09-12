'use strict'

import { STATUS_CODES as statusCodes }from 'http'

export const getFormatedDate = (): string => {
  let currentDate: Date = new Date()
  let currentDateStr: string = currentDate.toISOString()
  currentDateStr = currentDateStr.replace(/T/, ' ')
  currentDateStr = currentDateStr.replace(/\..+/, '')
  return currentDateStr;
};

export const nanoToMilliseconds = (nanoseconds: number): number => Math.floor(nanoseconds / 1e6)

export const nanoToSeconds = (nanoseconds: number): number => Math.floor(nanoseconds / 1e9)

export class ResponseData {
  time: any;
  statusCode: number;
  statusMessage: string;
  website: string;
  responseTime: number;
  address: string;
  port: number;

  httpResponse: any;

  constructor(statusCode: number, website: string, responseTime: number, address: string, port: number) {
    this.time = responseTime
    this.statusCode = statusCode
    this.statusMessage = statusCodes[statusCode] ?? ''
    this.website = website
    this.responseTime = responseTime
    this.address = address
    this.port = port
  }
}