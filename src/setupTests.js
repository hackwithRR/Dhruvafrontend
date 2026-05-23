
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;

// jest:
if (typeof global.ReadableStream === 'undefined') {
  try {
    // Node 18+ provides stream/web
    // eslint-disable-next-line import/no-extraneous-dependencies
    const { ReadableStream } = require('node:stream/web');
    global.ReadableStream = ReadableStream;
  } catch {
    // leave undefined; tests may still work if code path not executed
  }
}


