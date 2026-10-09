const bcrypt = require("bcrypt");

const passwordToCheck = "123456";
const hash = "$2b$10$lZiqet6GFQMAnw/LaxURT.IRyvQV164zUsFG9L2UmoYhYNzah1It6";

bcrypt.compare(passwordToCheck, hash).then((matches) => {
    console.log(matches ? "Password matches" : "Password does not match");
});