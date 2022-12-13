import { Injectable } from '@angular/core';
import { DatasourceService } from '@app/services/datasource.service';
import { RpcService } from '@app/services/rpc.service';

export type BananoifiedWindow = {
    bananocoinBananojs: any;
    shouldHaltClientSideWorkGeneration: boolean;
    isClientActivelyGeneratingWork: boolean;
    nanoWebglPow: any;
    startWasm: any;
} & Window;

declare let window: BananoifiedWindow;

// eslint-disable-next-line no-console
const log = (msg: string): void => console.log(msg);

const BAN_WORK_THRESHOLD = '0xFFFFFE00';

/** Responsible for remembering use settings & executing client-side pow via webgl or cpu when requested. */
@Injectable({
    providedIn: 'root',
})
export class PowService {
    isWebGLAvailable: boolean;

    constructor(private readonly _datasourceService: DatasourceService, private readonly _rpcService: RpcService) {}

    /** Changes the getGeneratedWork method of BananoJS */
    overrideDefaultBananoJSPowSource(): void {
        try {
            this._testWebGLSupport();
            this.isWebGLAvailable = false; // TODO: Remove me to re-enable webgl as the default (when applicable)
            log('Pow Service Initialized');
        } catch (err) {
            console.error(err);
        }
    }

    private _testWebGLSupport(): void {
        try {
            const canvas = document.createElement('canvas');
            const webGL =
                !!window['WebGLRenderingContext'] &&
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
            this.isWebGLAvailable = !!webGL;
        } catch (e) {
            this.isWebGLAvailable = false;
        }
    }

    /** Generate PoW using WebGL */
    private _startWorkWebGl(hash): Promise<string> {
        window.isClientActivelyGeneratingWork = true;
        return new Promise((resolve, reject) => {
            const start = Date.now();
            try {
                window.nanoWebglPow(
                    hash,
                    (work, n) => {
                        log(
                            `WebGL Worker: Found work (${work}) for ${hash} after ${
                                (Date.now() - start) / 1000
                            } seconds [${n} iterations]`
                        );
                        window.isClientActivelyGeneratingWork = false;
                        resolve(work);
                    },
                    () => {
                        if (window.shouldHaltClientSideWorkGeneration) {
                            window.isClientActivelyGeneratingWork = false;
                            log('Terminating client pow generate; server pow generated faster.');
                            return true;
                        }
                    },
                    BAN_WORK_THRESHOLD
                );
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
    }

    private _startWorkWasm(hash: string): Promise<string> {
        window.isClientActivelyGeneratingWork = true;
        return new Promise((resolve, reject) => {
            try {
                window.startWasm(hash, (work) => {
                    console.log('work = ' + work);
                    window.isClientActivelyGeneratingWork = false;
                    resolve(work);
                })
            } catch (err) {
                console.error(err);
                reject(err);
            }
        })
    }

    /** Generate PoW using Client CPU (slow as shit) */
    private _getJsBlakeWork(hash): string {
        const start = new Date().getTime();
        const workBytes = window.bananocoinBananojs.getZeroedWorkBytes();
        const work = window.bananocoinBananojs.getWorkUsingCpu(hash, workBytes);
        const end = new Date().getTime();
        const time = end - start;
        log(`Client POW generation time was ${time / 1000} seconds.`);
        return work;
    }

    async generateLocalWork(hash: string): Promise<string> {
        log('Racing Client-side PoW.');
        try {
            if (this.isWebGLAvailable) {
                log('Using WebGL for Client-side PoW.');
                const clientWork = await this._startWorkWebGl(hash);
                void this._rpcService.cancelWorkGenerate(hash);
                return clientWork;
            }
            log(`Client does not have support for WebGL, defaulting to WASM.`);

            const clientWork = await this._startWorkWasm(hash);
            void this._rpcService.cancelWorkGenerate(hash);
            return clientWork;
        } catch (err) {
            console.error(err);
            log(`Error using WebGL to generate local work.`);
            return Promise.reject();
        }
    }

    async generateRemoteWork(hash: string): Promise<string> {
        const datasource = await this._datasourceService.getRpcSource();
        log(`Racing Server-side PoW using ${datasource.alias} server.`);
        try {
            const work = await this._rpcService.generateWork(hash);
            return work;
        } catch (err) {
            log(`${datasource.alias} server did not provide work via 'work_generate' rpc call.`);
            console.error(err);
            return undefined;
        }
    }
}
