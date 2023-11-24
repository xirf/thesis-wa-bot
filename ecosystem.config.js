module.exports = {
	apps: [
		{
			name: "SimRS WhatsApp Bot",
			script: "./dist/src/index.js",
			// Restart after memory hit 1GB
            max_memory_restart: "1G",
            autorestart: true,
            exp_backoff_restart_delay: 100,
			// Env variables
			env: {
				NODE_ENV: "production",
			},
		},
	],
};
