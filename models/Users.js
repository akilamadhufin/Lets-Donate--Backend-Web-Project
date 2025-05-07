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

<<<<<<< HEAD
module.exports = mongoose.model("Users",userSchema)

  
=======
module.exports = mongoose.model("User",userSchema)
>>>>>>> 5d126a190abaf5ae6989ad45cf398809428ce038
