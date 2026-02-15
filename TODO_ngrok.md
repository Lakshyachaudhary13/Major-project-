# Ngrok Setup for External Access

This guide helps you set up ngrok to make your local server accessible from other devices (phone, other laptop) over the internet.

## Why Ngrok?

Your server is running on 192.168.1.6:8080, but:
- Windows Firewall is blocking external connections
- Other devices on your network can't access it directly
- Ngrok creates a secure tunnel to a public URL

## Option 1: Using npx (No install required)

Run this command in your terminal:

```
bash
npx ngrok http 8080
```

This will download and run ngrok temporarily.

## Option 2: Direct executable (Recommended for frequent use)

### Install ngrok:

1. Download ngrok from: https://ngrok.com/download
2. Extract the zip file
3. Move ngrok.exe to a folder in your PATH (optional)

Or use winget:

```
bash
winget install ngrok
```

### Run ngrok:

```
bash
ngrok http 8080
```

## After starting ngrok

1. You'll see output like:
   
```
   Session Status                online
   Account                      your@email.com
   Version                       3.x.x
   Region                        United States (us)
   Web Interface               http://127.0.0.1:4040
   Forwarding                   https://your-random.ngrok.io -> http://localhost:8080
   
```

2. The **Forwarding URL** (e.g., https://your-random.ngrok.io) is your public URL
3. Share this URL with others - they can access your site from anywhere!

## Notes

- **Authentication**: ngrok requires free account for persistent URLs. Sign up at https://ngrok.com
- **Sharing URL**: Send the https://your-random.ngrok.io link to others
- **HTTP vs HTTPS**: Use HTTP URL if not configured for HTTPS
- **Web Interface**: Visit http://127.0.0.1:4040 to see request logs

## Troubleshooting

- If port 8080 is busy, use a different port: `ngrok http 3000`
- For auth, run: `ngrok authtoken YOUR_AUTH_TOKEN`
- Check logs at http://127.0.0.1:4040
