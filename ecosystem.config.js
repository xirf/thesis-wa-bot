module.exports = {
    apps: [ {
        name: "Thesis Whatsapp Bot",
        script: "./dist/src/index.js",
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
    } ]
};