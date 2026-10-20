# Architecture rules

- The hall kiosk renders its active-event smartphone QR alongside the existing gift iframe, using the shared QRCodeCanvas and the public direct gift route; scanning must not navigate or reset the kiosk.
- Hide the global accessibility widget on kiosk routes and in their same-origin gift frames to prevent navigation from the kiosk to the marketing site; retain it on standalone public pages.