## 'Smoke' Test Category

**Create New Wallet**

A new wallet can be created.
* Navigate to Settings / New Wallet
* Select New Wallet, press button
* EXP: Success message, mnemonic and seed are shown
* Copy and save seed (in case it is needed later)
* Confirm
* EXP: password screen is shown
* Enter a valid password (twice), press button
* EXP: Success
* Select View Accounts button
* EXP: One new account is shown, with 0 balance

**Open Wallet**

The web wallet can be opened.
* Navigate to https://wallet.mikron.io
* EXP: The web wallet loads, the welcome page is shown.

**Import Seed**

It is possible to import a wallet by seed.
* PR: No wallet set up, seed of an existing wallet with existing transactions
* Open Welcome screen
* EXP: Message about not-configured wallet, buttons for create or import wallet
* Select Import Wallet
* Select Import Seed
* Enter the seed, press Import
* EXP: Success, Set Password is shown
* Enter a valid password (twice), press button
* EXP: Success
* Select View Accounts button
* EXP: Correct account are shown, with correct balances
* Select an account
* EXP: History is shown

**View Balance and History**

Account and history is shown.
* PR: A configured wallet, with existing transactions and balance
* Select Accounts
* EXP: Account(s) is shown, with balance(s)
* Select an account
* EXP: History is shown

**Send**

It is possible to send mikron to another account.
* PR: A configured wallet, with non-zero balance
* PR: Another address, preferrably from another wallet
* Copy the target account to clipboard
* Select Send menu
* Select source account
* Paste target account
* Select a small amount
* Press Send
* EXP: Confirmation screen comes up, with source and target accounts, with current and preview balances
* Press Confirm&Send
* EXP: Success message appears
* Go back to Accounts, select source account
* Check send in history (with negative balance) 

**Online Receive**

It is possible to receive from another account, and if the wallet is open, the receive happens automatically.
* PR: a source account, from another wallet (with other seed), active in preferrably in other wallet (e.g. desktop, send form site, etc.)
* PR: a target account, configured in the web wallet
* Go to Accounts
* Copy the target account to clipboard
* Send a small amount to this account from the source account
* Make sure min. 10 seconds has passed
* Watch the (target) account in the web wallet
* EXP: shown balance is increased
* Check the history
* EXP: receive is show on top
* Select block details (by clicking on the hash)
* EXP: Check source and target accounts, amount, balance, and date are correct, hash is present
* Check the history in the official explorer too (e.g. https://mikron.io/en/mikron-explorer/mik_35qun9eizbzxr6etq8mbwjhaf7616bday6c8h8nc14wk3a93yff7dgowrrcw)

## 'Test Me First' Test Category

**Import Mnemonic**

**Lock Wallet**

**Unlock Wallet**

**Create Account**

**Receive while locked**

**Receive while closed**

**Change Language (menu)**

It is possible to change the UI language from the menu.

**Retrieve Seed**

It is possible to retrieve the seed of the configured account.
* PR: A configured wallet, with existing 
* Select Settings / Manage Wallet
* Copy Seed to clipboard
* EXP: Success message
* Paste to a text editor
* EXP: Correct seed was in clipboard

**Retrieve Mnemonic**

## 'All' Test Category

**Change Language (settings)**

It is possible to change the UI language from the settings.

**Change Language (query param)**

URL query param overrides the UI language setting.

**Delete Account**

**Show Block (transaction) Details**
