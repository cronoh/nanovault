/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

declare module 'nanowarpwallet' {
  export interface ProgressInfo {
    what: string,
    i: number
  }
  export interface WarpParams {
    passphrase: string,
    salt: string,
    progress_hook: (progress: ProgressInfo) => any | null
  }
  export interface WarpResponse {
    seed: string,
    publicKey: string,
    privateKey: string,
    address: string
  }
  export default function warp(params: WarpParams, callback: (response: WarpResponse) => any)
}
