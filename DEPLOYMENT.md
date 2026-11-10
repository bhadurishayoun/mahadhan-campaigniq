# Publishing Mahadhan CampaignIQ (step by step)

You will end up with:

* the website at `https://bhadurishayoun.github.io/mahadhan-campaigniq/` (GitHub Pages)
* optionally, the backend at `https://mahadhan-campaigniq-api.onrender.com` (Render, free)

Replace `bhadurishayoun` everywhere with your GitHub username.

---

## Part A - Put the code on GitHub

### 1. Create the repository

1. Sign in at https://github.com (create a free account if you don't have one).
2. Click **+** (top right) -> **New repository**.
3. Repository name: `mahadhan-campaigniq`. Visibility: **Public**.
4. Leave "Add a README", ".gitignore" and "license" **unticked** (the project already has them).
5. Click **Create repository**.

> Public means anyone can see every file, including the briefs, the PowerPoint and the mockups.

### 2a. Upload with Git (recommended)

1. Install Git: https://git-scm.com/download/win (accept the defaults). Close and reopen PowerShell.
2. Tell Git who you are (once per computer):
   ```powershell
   git config --global user.name "Your Name"
   git config --global user.email "you@example.com"
   ```
3. Upload the project:
   ```powershell
   cd "C:\Users\DELL\OneDrive\Desktop\Mahadhan_Campaign_Management_Tool"
   git init -b main
   git add .
   git commit -m "Initial version of Mahadhan CampaignIQ"
   git remote add origin https://github.com/bhadurishayoun/mahadhan-campaigniq.git
   git push -u origin main
   ```
   The first `git push` opens a browser window to sign in to GitHub - approve it.
   `.gitignore` makes sure `node_modules`, build output, `.env` files and local databases are **not** uploaded.

### 2b. Or upload on the GitHub website (no Git needed)

1. Open your new repository and click **uploading an existing file**.
2. In File Explorer open `Mahadhan_Campaign_Management_Tool`. Drag in everything **except** these folders:
   `campaigniq\node_modules`, `campaigniq\web\node_modules`, `campaigniq\web\dist`, any `__pycache__` folder
   and the files `campaigniq\server\data\*.db`. (The website uploader does not read `.gitignore`.)
   GitHub accepts up to 100 files per upload - if it complains, upload the `campaigniq` folder first, then the rest.
3. Click **Commit changes**.
4. Check that the folder `.github/workflows` with `deploy.yml` arrived (some browsers skip folders that start
   with a dot). If it is missing: **Add file -> Create new file**, type `.github/workflows/deploy.yml` as the
   name, paste the contents of that file from your computer, and **Commit changes**.

## Part B - Turn on GitHub Pages

3. In the repository: **Settings -> Pages**.
4. Under **Build and deployment -> Source**, choose **GitHub Actions**.
5. Open the **Actions** tab. A run called **Deploy to GitHub Pages** starts (it also starts on every push).
   If nothing is running, click **Deploy to GitHub Pages -> Run workflow**.
6. Wait for the green tick (about 2 minutes).

### Your live link

7. **Settings -> Pages** shows "Your site is live at **https://bhadurishayoun.github.io/mahadhan-campaigniq/**".
   It is also shown on the finished run in the Actions tab. Open it - the site works now as a static demo.

## Part C - Connect the backend on Render (optional, for the live engine)

8. Sign up free at https://render.com with **Sign in with GitHub**.
9. **New -> Blueprint** -> choose the `mahadhan-campaigniq` repository -> **Apply**.
   Render reads `render.yaml` and creates the service `mahadhan-campaigniq-api`.
10. When asked for **CAMPAIGNIQ_CORS_ORIGINS**, enter `https://bhadurishayoun.github.io` (no slash, no path).
    Leave **COPILOT_API_KEY** empty unless you have an AI key.
11. Wait until the service says **Live**. Copy its address, e.g. `https://mahadhan-campaigniq-api.onrender.com`.
    Check it works: open `<that address>/api/health` - you should see `{"ok":true,...}`.
12. Back on GitHub: **Settings -> Secrets and variables -> Actions -> Variables tab -> New repository variable**.
    Name: `VITE_API_URL`. Value: the Render address + `/api`, e.g. `https://mahadhan-campaigniq-api.onrender.com/api`.
13. **Actions -> Deploy to GitHub Pages -> Run workflow** to rebuild the site with the backend connected.

The free Render server sleeps after ~15 minutes without visitors; the first request then takes up to a minute.
Its database is temporary and is re-created with the demo data every time it restarts.

## Updating the tool later

* **With Git:** edit files, then
  ```powershell
  cd "C:\Users\DELL\OneDrive\Desktop\Mahadhan_Campaign_Management_Tool"
  git add .
  git commit -m "Describe what you changed"
  git push
  ```
* **On the website:** open a file on GitHub -> pencil icon -> edit -> **Commit changes**, or **Add file -> Upload files**.

Every push to `main` rebuilds and republishes the site automatically (watch the **Actions** tab).
Render also redeploys the backend automatically when backend files change.

## Keeping secrets safe

* Never put passwords or API keys in the code - everything in this repository is public.
* Keys belong in the **Render dashboard -> Environment** (backend) or in GitHub **Secrets** - never in files.
* Local settings go in `campaigniq/server/.env`, which Git ignores.
* If a key is ever pushed by mistake, revoke it with the provider immediately (deleting the file is not enough -
  it stays in the Git history).

## If something goes wrong

| Problem | Fix |
|---|---|
| Actions run fails at "Deploy" with a Pages error | Settings -> Pages -> Source must be **GitHub Actions** (step 4), then re-run. |
| Live site shows 404 | Wait a minute after the first successful run; check the link ends with `/mahadhan-campaigniq/`. |
| Prototype screens say "backend not connected" | Do Part C, then re-run the workflow (step 13). |
| Prototype screens say "backend unreachable" | The free Render server is waking up - wait a minute and reload. If it persists, check `CAMPAIGNIQ_CORS_ORIGINS` (step 10). |
