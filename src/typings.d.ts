declare module 'nanowarpwallet' {
  function warp(params: {
      passphrase: string,
      salt: string,
      progress_hook?: (progress: {
        what: string,
        i: number,
        total: number
      }) => any
    },
    callback: (
      response: {
        seed: string,
        publicKey: string,
        privateKey: string,
        address: string
      }
    ) => any
  )

  export = warp;
}

/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}
