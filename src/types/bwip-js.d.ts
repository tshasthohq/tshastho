declare module 'bwip-js' {
  export interface ToBufferOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    includetext?: boolean;
    textxalign?: 'center' | 'left' | 'right';
    textsize?: number;
    [key: string]: any;
  }

  export function toBuffer(options: ToBufferOptions): Promise<Buffer>;

  const bwipjs: {
    toBuffer: typeof toBuffer;
  };

  export default bwipjs;
}
