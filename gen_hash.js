const bcrypt = require('bcrypt');
const passwords = ['operator123'];
passwords.forEach(pw => {
    const hash = bcrypt.hashSync(pw, 10);
    console.log(`${pw}: ${hash}`);
});
