module.exports = {
    apps: [ {
        name: "Thesis Whatsapp Bot",
        script: "./dist/src/index.js",
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1500M',
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
        },
        log_file: "./logs/bot.log",
        error_file: "./logs/bot_error.log",
        time: true,
        merge_logs: false
    } ]
};