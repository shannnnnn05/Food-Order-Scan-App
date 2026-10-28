# LigtasPangan

A browser extension that checks online food ordering pages for fake sellers, phishing payment forms, hidden fees and copied reviews. It warns the buyer before any payment is made.

Mini capstone project · CCDI Sorsogon · BSIT 3A

---

## What it does

When you open an online food ordering page, LigtasPangan reads the public page content and its payment form. It gives the page a risk score from 0 to 100 and shows the result in the browser.

- **Safe page** shows a green message: `This is a safe and good food ordering app`.
- **Caution or unsafe page** first shows a red bar: `This Page is not safe, see it for yourself. Just click the OK to proceed`. Pressing OK opens the full alert page with every reason, the score and the steps to take.
- A badge at the bottom right always shows the current score. Click it for the short explanation, or open the toolbar popup for the complete report.

The scanner runs fully inside the browser. It does not need a server, an account or an internet connection.

---

## Records

This is a new project and it has not been tested by real sellers yet. All community records start at zero:

| Record | Value |
|---|---|
| Seller ratings | 0.0 |
| Reviews | 0 |
| Verified sellers | 0 |
| Community alerts | 0 |
| Reports | 0 |

No reviews, sellers or alerts are seeded. Every check the scanner makes is written to an admin log inside the extension, with the verdict and the name of the account that made the check.

### Who a check is recorded under

- A Gmail account already signed in to the browser is used as the name. The address comes from the browser profile, or from the Google account shown on a Gmail page when one is open.
- Without a signed in account the check is a guest, named Guest 1, Guest 2 and so on for each new guest session. The Admin tab has a button to start the next guest.

Open the popup and choose Settings, then the Admin tab, to see every safe, caution and unsafe check with the account, the score and the date. Reports submitted by hand are listed under the same tab.

---

## Project structure

```
ligtas-pangan/
├── index.html                  start page that opens the install home
├── extension/                  the installable browser extension
│   ├── manifest.json
│   ├── pahina/
│   │   ├── giya.html           install home page, opens after install
│   │   ├── pitik.html          toolbar popup
│   │   └── pilian.html         settings, admin records and seller lists
│   ├── pinulongan/
│   │   ├── kakanon.js          signal reader and risk scoring engine
│   │   ├── bantay.js           service worker, badge, storage and messages
│   │   ├── patanid.js          on-page warning bar, alert page and report form
│   │   ├── tuklas.js           reads the signed in Gmail account on Gmail pages
│   │   ├── pitik.js            popup logic
│   │   ├── pilian.js           settings logic
│   │   └── giya.js             install home logic
│   ├── estilo/
│   │   └── itsura.css          shared interface theme
│   └── ladawan/                extension icons
├── home/
│   └── index.html              installer home page for sharing
├── pagsubok/                   practice pages
│   ├── index.html              practice hub with expected results
│   ├── tunay-tindahan.html     legitimate seller, expected safe
│   ├── pekeng-kusina.html      ghost kitchen, expected unsafe
│   ├── pekeng-bayaran.html     phishing payment form, expected unsafe
│   ├── presyong-panlinlang.html price trap, expected caution
│   ├── pekeng-rebyu.html       copied reviews, expected caution
│   ├── pekeng-kantina.html     fake school canteen, expected unsafe
│   └── estilo/
│       └── pagsubok.css
├── serve/
│   └── server.js               local static server for the practice pages
└── README.md
```

---

## Install

### Chrome or Edge

1. Unzip the project and keep the folder.
2. Open `chrome://extensions` or `edge://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the `extension` folder.
5. Pin LigtasPangan from the puzzle piece menu.

The install home page opens on its own the first time. It explains the scanner, the permissions and the test pages.

### One-click launcher for Windows

Double-click **`run.bat`** in the project folder. It starts the test server and opens Chrome or Edge with LigtasPangan already loaded, so no manual step is needed during a demo or a defense.

- The browser opens with its own `chrome-profile` folder inside the project, so the extension stays active in that window only.
- Chrome and Edge still do not allow a web page to install an extension. The launcher is a Windows file that starts the browser with the extension folder, not a web installer.
- For a permanent install on a personal browser, use **Load unpacked** above.

---

## Test the scanner

The practice pages need the small local server because browser extensions do not run on `file://` pages.

```bash
node serve/server.js
```

Then open:

```
http://127.0.0.1:4173/pagsubok/
```

| Page | Scenario | Expected |
|---|---|---|
| Tunay na Tindahan | Permit, address, phone, recognized gateway, matching prices | Safe |
| Pekeng Kusina | No seller identity, card fields, 40% price jump, copied reviews | Unsafe |
| Pekeng Bayaran | Card, password and PIN fields, form posts to another host over HTTP | Unsafe |
| Presyong Panlinlang | Checkout total higher than the advertised price, service fee only at checkout | Caution |
| Pekeng Rebyu | Six identical five-star reviews posted within minutes | Caution |
| Pekeng Kantina | Fake campus canteen, advance GCash payment, PIN request, external form | Unsafe |

The same server also serves the project home at `http://127.0.0.1:4173/`.

---

## How the score works

Twenty-six checks contribute to a weighted score. Positive checks reduce risk, warning checks increase it.

Main warning checks include:

- connection without HTTPS
- raw IP host, punycode host, hyphen-heavy host or high-abuse domain
- card, password or one-time PIN fields
- payment form that posts over HTTP or to another site
- checkout price higher than the menu price
- fees that appear only at checkout
- repeated review wording and review bursts
- demand for full advance payment
- missing contact number, address or business permit

Main positive checks include:

- published contact number and address
- stated business registration
- recognized payment gateway
- prices that match between menu and checkout
- clear food ordering content
- reachable contact and policy links

Thresholds: `0–29` safe, `30–64` caution, `65–100` unsafe.

Known food delivery platforms are always checked, even before the page finishes loading, and stay in the safe range unless a hard warning fires: an insecure form, a form that posts to another site, a demand for full advance payment, or a checkout price at least 20% above the menu price. The list covers foodpanda, GrabFood, Lalamove, angkas, pickaroo, metromart and the main Philippine chains such as Jollibee, McDonald's, KFC, Chowking, Mang Inasal, Shakey's, Greenwich, Domino's, Pizza Hut, Burger King, Red Ribbon, Goldilocks, Bonchon, Pancake House and Max's.

The score is a warning signal, not a guarantee. Always check the seller's permit, reviews and receipt.

---

## Settings

Open the extension popup and choose **Settings**.

- turn scanning, badge, warning bar or safe message on and off
- choose whether warnings start at caution or only at unsafe
- add trusted sellers that never raise the warning bar
- add blocked sellers that are always treated as unsafe
- view and clear reports from this browser
- read the permission and privacy notes

Trusted and blocked lists are stored with the browser profile. Reports are stored locally.

---

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves settings, seller lists, the check log and reports |
| `tabs` | Reads the current page address for the badge and popup |
| `identity` | Reads the Gmail address already signed in to the browser, only to label each saved check |
| http and https page access | Reads public page content and detects payment fields |

Text field values are never read. The extension only checks field names, page text, links and form targets.

---

## Privacy

- Page content is analysed on the device. Nothing is uploaded.
- Card numbers, passwords and PIN values are never read, copied or stored.
- No account creation and no sign in form. A Gmail address is only read as a label when the browser is already signed in; otherwise the check is saved as a guest.
- Reports stay in the browser and can be cleared at any time.
- The extension never processes payments.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| No badge on a page | The page may not look like an online seller. Open the popup and press Re-scan page. |
| No badge on a practice page | Load the extension, then refresh the practice page. |
| Practice page does not open | Run `node serve/server.js` and use `http://127.0.0.1:4173/pagsubok/`. |
| The install page did not open | Open the extension popup and choose Install guide. |

---

## Credits

Developed for the CCDI Sorsogon BSIT 3A mini capstone: Kristian Amosco, Ezekiel Haboc, Adams Divina, Brent Condeno and John Rey Buergo.

Academic use.
