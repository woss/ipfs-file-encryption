import Image, { getImageData, imageFromBuffer } from '@canvas/image'
import blockhash from 'blockhash-core'

/**
 * Format type
 */
export enum PhashOutputFormat {
  HEX,
  BINARY,
}

export async function calculatePhash(content: Buffer, bits = 8, format = PhashOutputFormat.BINARY) {
  const image = await imageFromBuffer(content)
  const imageData = getImageData(image)

  if (imageData === undefined) {
    throw new Error('Image cannot be accessed')
  }

  const hexHash = blockhash.bmvbhash(imageData, bits)

  switch (format) {
    case PhashOutputFormat.BINARY:
      return hexToBinary(hexHash)
    default:
    case PhashOutputFormat.HEX:
      return hexHash
  }
}

/**
 * Convert the HEX to BINARY string
 * @param [string] s
 */
export function hexToBinary(s: string): string {
  const lookup: { [key in number | string]: string } = {
    0: '0000',
    1: '0001',
    2: '0010',
    3: '0011',
    4: '0100',
    5: '0101',
    6: '0110',
    7: '0111',
    8: '1000',
    9: '1001',
    a: '1010',
    b: '1011',
    c: '1100',
    d: '1101',
    e: '1110',
    f: '1111',
    A: '1010',
    B: '1011',
    C: '1100',
    D: '1101',
    E: '1110',
    F: '1111',
  }
  let ret = ''
  for (let i = 0; i < s.length; i++) {
    if (lookup[s[i]]) {
      ret += lookup[s[i]]
    } else {
      throw new Error(`${s[i]} doesn't exist in the hex lookup table`)
    }
  }

  return ret
}

/**
 * Convert BINARY to HEX
 * @param s
 */
export function binaryToHex(s: string): string {
  const lookup: { [key in number | string]: string } = {
    '0000': '0',
    '0001': '1',
    '0010': '2',
    '0011': '3',
    '0100': '4',
    '0101': '5',
    '0110': '6',
    '0111': '7',
    1000: '8',
    1001: '9',
    1010: 'a',
    1011: 'b',
    1100: 'c',
    1101: 'd',
    1110: 'e',
    1111: 'f',
  }
  let ret = ''
  for (let i = 0; i < s.length; i += 4) {
    const chunk = s.slice(i, i + 4)
    if (lookup[chunk]) {
      ret += lookup[chunk]
    } else {
      throw new Error(`${chunk} doesn't exist in the bin lookup table`)
    }
  }
  return ret
}
