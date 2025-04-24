const mongoose = require('mongoose');
//const bcrypt = require('bcrypt'); // to hash the passowrd

const userSchema = new mongoose.Schema({

    firstname: {
        type:String,
        required: true,
        trim: true
        },

    lastname: {
        type:String,
        required: true,
        trim: true
        },

    email: {
        type:String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
        },

    contactnumber: {
        type: String,
        required: true,
        trim: true
        },

    address: {
        type: String,
        required: true,
        trim: true
        },

    password: {
        type: String,
        required: true
        },
      
});

module.exports = mongoose.model("Users",userSchema)