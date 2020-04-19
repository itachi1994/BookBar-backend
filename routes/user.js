import Joi from 'joi';
import express from 'express';
import User from '../models/user.schema';
import {signUp} from '../validations/user';
import {parseError, sessionizeUser} from "../util/helper";

const userRoutes = express.Router();

userRoutes.post("", async (req, res) => {
    try {
        const {username, email, password, userType, address} = req.body
        await Joi.validate({username, email, password}, signUp);

        const newUser = new User({username, email, password, userType, address});
        const sessionUser = sessionizeUser(newUser);
        await newUser.save();
        req.session.user = sessionUser;
        console.log('in signup session')
        console.log(req.session.user)
        res.send(sessionUser);
    } catch (err) {
        res.status(400).send(parseError(err));
    }
});

userRoutes.post("/updateProfile", ({session, body}, res) => {
    const userId = session.user.userId;
    const update = {}
    const updateAddress = {}
    if (body.firstName) {
        update.firstName = body.firstName
    }
    if (body.lastName) {
        update.lastName = body.lastName
    }
    if (body.password) {
        update.password = body.password
    }
    if (body.email) {
        update.email = body.email
    }
    const receivedAddress = body.address
    if (receivedAddress.street) {
        updateAddress.street = receivedAddress.street
    }
    if (receivedAddress.city) {
        updateAddress.city = receivedAddress.city
    }
    if (receivedAddress.state) {
        updateAddress.state = receivedAddress.state
    }
    if (receivedAddress.country) {
        updateAddress.country = receivedAddress.country
    }
    if (receivedAddress.pincode) {
        updateAddress.pincode = receivedAddress.pincode
    }
    if (updateAddress) {
        update.address = updateAddress
    }

    const query = {_id: userId};
    User.findOneAndUpdate(query, update, {upsert: true}, (err, doc) => {
        if (err) {
            return res.send(500, {error: err});
        }
        return res.send('Succesfully saved.');
    })
})

userRoutes.get("", ({session}, res) => {
    const userId = session.user.userId;
    const projection = ' -_id firstName lastName password email address'
    User.findById(userId, projection, (err, user) => {
        if (err) {
            return res.status(500).send({error: err})
        }
        return res.send(user)
    })
})
export default userRoutes;
