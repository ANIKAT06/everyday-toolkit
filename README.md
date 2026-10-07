# Everyday Toolkit

**Free, privacy-first browser tools for everyday tasks—calculators, converters, text helpers, and more. No account or tracking.**

A small, welcoming collection of practical tools that runs in your browser. No framework, build step, sign-up, third-party library, analytics, or backend.

## Tools

- **Calculator** — arithmetic with parentheses, keyboard input, and a tip-and-bill-split helper.
- **Unit converter** — length, weight, temperature, and volume conversions.
- **Text helper** — live word, character, and line counts; uppercase, lowercase, title case, sentence case, whitespace cleanup, and copy.
- **Date calculator** — days between dates and date addition/subtraction.
- **Password maker** — configurable length and character sets, generated with the browser's Web Crypto API.

## Try it

Open [`index.html`](./index.html) in a browser, or serve the folder locally:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000>. The service worker and installable-app features require a secure context (HTTPS or localhost). GitHub Pages is also supported: in the repository settings, choose **Pages**, deploy from the `main` branch and `/ (root)`, and save. No build command is needed.

## Privacy

Every calculation and text transformation happens in your browser. The app sends no form values to a server and includes no analytics, ads, trackers, or third-party runtime dependencies. The optional theme preference is stored in local browser storage. After the first successful visit, the static app shell can be cached for offline use by the service worker. Clipboard access is only requested when you choose a Copy button.

The password maker uses `crypto.getRandomValues`; it does not store or transmit generated passwords. For critical accounts, use a trusted password manager and follow the service's current security guidance.

## Accessibility

The interface uses semantic landmarks, labelled inputs, keyboard-operable controls, visible focus styles, reduced-motion support, status announcements, and a narrow-screen layout. Contributions that improve accessibility are welcome.

## Contributing

Bug reports, accessibility improvements, translations, and small focused tools are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a change. Please keep the app dependency-free and local-first; proposed features should explain their privacy impact.

## License

Released under the [MIT License](./LICENSE).
