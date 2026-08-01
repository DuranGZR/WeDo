# WeDo Share Module

Native share receivers pass data into the shared `SharePayload` contract. The
React Native layer validates the payload and writes it to the SQLite outbox
when the device is offline.
