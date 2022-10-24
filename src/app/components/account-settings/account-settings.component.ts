import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { SecretService } from '@app/services/secret.service';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ChangePasswordDialogComponent } from '@app/overlays/dialogs/change-password/change-password-dialog.component';
import { ViewportService } from '@app/services/viewport.service';
import { ChangePasswordBottomSheetComponent } from '@app/overlays/bottom-sheet/change-password/change-password-bottom-sheet.component';
import {ThemeService} from "@app/services/theme.service";

@Component({
    selector: 'app-account-settings',
    template: `
        <ng-template #accountActionsMenu>
            <div class="mat-overline" style="padding-left: 16px">Themes</div>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="toggleJungleGreenTheme()">
                <mat-icon>light_mode</mat-icon>
                <span>Jungle Green</span>
            </button>
            <button mat-menu-item (click)="toggleNanoBlueTheme()">
                <mat-icon>light_mode</mat-icon>
                <span>Nano Blue</span>
            </button>
            <button mat-menu-item (click)="toggleBananoYellowTheme()">
                <mat-icon>dark_mode</mat-icon>
                <span>Banano Yellow</span>
            </button>

            <ng-container *ngIf="isUserLoggedIn()">
                <div class="mat-overline" style="margin-top: 24px; padding-left: 16px">Advanced</div>
                <button mat-menu-item (click)="navigateToSettingsPage()">
                    <mat-icon>settings</mat-icon>
                    <span>Advanced</span>
                </button>
            </ng-container>
        </ng-template>
        <ng-template #desktopTrigger>
            <button mat-icon-button>
                <mat-icon>settings</mat-icon>
            </button>
        </ng-template>
        <ng-template #mobileTrigger>
            <mat-icon>settings</mat-icon>
        </ng-template>
        <responsive-menu
            menuTitle="Settings"
            [(open)]="userMenuOpen"
            [menu]="accountActionsMenu"
            [desktopTrigger]="desktopTrigger"
            [mobileTrigger]="mobileTrigger"
            data-cy="change-password-button"
        >
        </responsive-menu>


        <!--
                <blui-user-menu *ngIf="show()" data-cy="session-settings" menuTitle="Settings" [(open)]="userMenuOpen">
                    <mat-icon blui-avatar>settings</mat-icon>
                    <mat-nav-list blui-menu-body [style.paddingTop.px]="0">
                        <blui-info-list-item
                            [dense]="true"
                            (click)="openChangePasswordOverlay()"
                            data-cy="change-password-button"
                        >
                            <mat-icon blui-icon>lock</mat-icon>
                            <div blui-title>Change Password</div>
                        </blui-info-list-item>
                    </mat-nav-list>
                </blui-user-menu>
                -->
    `,
    styleUrls: ['./account-settings.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class AppAccountSettingsComponent {
    userMenuOpen = false;
    bottomSheetOpenDelayMs = 250;

    constructor(
        private readonly _router: Router,
        public vp: ViewportService,
        private readonly _dialog: MatDialog,
        private readonly _sheet: MatBottomSheet,
        private readonly _secretService: SecretService,
        private readonly _theme: ThemeService
    ) {}

    toggleJungleGreenTheme(): void {
        this.userMenuOpen = false;
        this._theme.setTheme('jungle-green');
    }

    toggleBananoYellowTheme(): void {
        this.userMenuOpen = false;
        this._theme.setTheme('banano-yellow');
    }

    toggleNanoBlueTheme(): void {
        this.userMenuOpen = false;
        this._theme.setTheme('nano-blue');
    }

    navigateToSettingsPage(): void {
        this.userMenuOpen = false;
        setTimeout(() => {
            void this._router.navigate(['/settings']);
        }, 100);
    }

    openChangePasswordOverlay(): void {
        this.userMenuOpen = false;
        if (this.vp.sm) {
            setTimeout(() => {
                this._sheet.open(ChangePasswordBottomSheetComponent);
            }, this.bottomSheetOpenDelayMs);
        } else {
            this._dialog.open(ChangePasswordDialogComponent);
        }
    }

    isUserLoggedIn(): boolean {
        return this._secretService.hasSecret() && this._secretService.isLocalSecretUnlocked();
    }
}
