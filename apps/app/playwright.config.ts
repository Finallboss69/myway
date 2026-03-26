import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	timeout: 30000,
	retries: 0,
	reporter: [["list"], ["html", { outputFolder: "e2e/report", open: "never" }]],
	use: {
		baseURL: "https://myway-pi.vercel.app",
		trace: "on",
		screenshot: "on",
		video: "off",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
