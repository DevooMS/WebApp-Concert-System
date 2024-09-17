'use strict';

/* Data Access Object (DAO) module for accessing users data */

const db = require('../../db');
const crypto = require('crypto');

// This function is used at log-in time to verify username and password.
exports.getLogin = (username, password) => {
  //console.log("BACKEND:", username, password);
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM Users WHERE username=?';
    db.get(sql, [username], (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        resolve(false);
      } else {
        const user = {user_id: row.user_id, username: row.username, role: row.is_loyal_customer};
        //console.log("id", row.user_id);
        // Check the hashes with an async call, this operation may be CPU-intensive (and we don't want to block the server)
        crypto.scrypt(password, row.salt, 32, function (err, hashedPassword) { // WARN: it is 64 and not 32 (as in the week example) in the DB
          if (err) reject(err);
          if (!crypto.timingSafeEqual(Buffer.from(row.hash, 'hex'), hashedPassword)) // WARN: it is hash and not password (as in the week example) in the DB
            resolve(false);
          else
            resolve(user);
        });
      }
    });
  });
};
