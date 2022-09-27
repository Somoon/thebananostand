import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { LocalStorageWallet } from '@app/services/wallet-storage.service';

@Injectable({
    providedIn: 'root',
})
export class WalletEventsService {
    /** A wallet (either secret or ledger) has been unlocked. */
    walletUnlocked = new Subject<{ isLedger: boolean }>();

    /** A wallet (previously unlocked) has been effectively logged out with no remaining secrets known. */
    walletLocked = new Subject<void>();

    /** A new secret has been provided */
    addWallet = new Subject<LocalStorageWallet>();

    /** The actively displayed wallet on the dashboard has changed. */
    activeWalletChange = new Subject<LocalStorageWallet>();

    /** A new address (index) has been added to the dashboard. */
    addIndex = new Subject<number>();

    /** An address (index) has been removed from the dashboard. */
    removeIndex = new Subject<number>();

    /** An account is being added to the dashboard. Can be either true or false. */
    accountLoading = new Subject<boolean>();

    /** User has requested that all loaded indexes be refreshed, checking for receivable transactions and updating account balances. */
    refreshIndexes = new Subject<void>();

    /** A wallet has been removed. */
    removeWallet = new Subject<void>();

    /** A wallet has been given an alias. */
    renameWallet = new Subject<string>();
}