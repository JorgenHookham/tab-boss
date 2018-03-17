# Tab Boss Chrome Extension

Manages chrome tabs to display multiple dashboards and push alerts on one TV.

## Try It Out

1. `git clone https://github.com/JorgenHookham/tab-boss.git`
2. Navigate to `chrome://extension` in chrome.
3. Activate developer mode
4. Select `load unpacked` and select the tab-boss directory

## Web Hooks

The text field will allow you to point the extension at a web socket URL. Any message received through the socket will be dumped into a notification that is displayed on all tabs and will play a sound. Try the [simple socket service for tab boss](https://github.com/JorgenHookham/tab-boss-socket-service.git).
