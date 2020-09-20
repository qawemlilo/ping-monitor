'use strict'

export const sleep = (milliseconds: number): Promise<void> => new Promise(resolve => setTimeout(resolve, milliseconds))

export const getFormatedDate = (): string => {
  let currentDate: Date = new Date()
  let currentDateStr: string = currentDate.toISOString()
  currentDateStr = currentDateStr.replace(/T/, ' ')
  currentDateStr = currentDateStr.replace(/\..+/, '')
  return currentDateStr
}

export const nanoToMilliseconds = (nanoseconds: number | bigint): number => { 
  let diff: number
  if (typeof nanoseconds === 'bigint') {
    diff = Number((nanoseconds / BigInt(1e6)))
    if(diff === 0) {
      diff = Number(nanoseconds) / 1e6
    }
  } else {
    diff = nanoseconds / 1e6
  }
  return Math.floor(diff)
}

export const nanoToSeconds = (nanoseconds: number): number => Math.floor(nanoseconds / 1e9)
