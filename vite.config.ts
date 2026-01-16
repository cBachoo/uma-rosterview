import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vite.dev/config/
export default defineConfig({
	plugins: [svelte()],
	// Set base path for GitHub Pages (change 'gluefac' to your repo name)
	base: process.env.GITHUB_ACTIONS ? '/gluefac/' : '/',
	// css: {
	// 	preprocessorOptions: {
	// 		scss: {
	// 			silenceDeprecations: [
	// 				"import",
	// 				"mixed-decls",
	// 				"color-functions",
	// 				"global-builtin",
	// 			],
	// 		},
	// 	},
	// },
});
