//server.js
const app = require("./app"),
    PORT = process.env.PORT || 5555;
// set port, listen for requests
app.listen(PORT, () => {
    console.log(`\n================================\nServer is running on port ${PORT}.\n================================\n`);
});
