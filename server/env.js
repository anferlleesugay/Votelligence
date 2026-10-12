// Loads the variables from .env into process.env.
// This lives in its own file and is imported FIRST in app.js, because ES module
// imports run before the rest of app.js. If dotenv.config() were called inside
// app.js, db.js would already have read empty values.
import dotenv from 'dotenv';

dotenv.config({ quiet: true });
