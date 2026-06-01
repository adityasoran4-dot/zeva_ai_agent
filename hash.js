// hash.js
// const bcrypt = require('bcryptjs');

// const plainPassword = 'admin123!';
// bcrypt.hash(plainPassword, 10).then((hashedPassword) => {
//   console.log('Hashed password:', hashedPassword);
// });

const bcrypt = require('bcryptjs');

const plainPassword = 'lead123';
bcrypt.hash(plainPassword, 10).then((hashedPassword) => {
  console.log('Hashed password:', hashedPassword);
});
