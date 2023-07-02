const mongoose = require('mongoose');

//to define schema for our user
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
}, { timestamps: true });

//to define a model
const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;