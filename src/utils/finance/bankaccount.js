const { default: axios } = require("axios");
const config = require('../config')
const { User, Rider } = require('../../models/users.model');
const { DedicatedVirtualAccount } = require("../../models/payment_info.model");

async function createCustomerProfileForDedicatedAccount(user_data) {
    const { email, first_name, lastname, phone } = data

    // Send request to paystack API to create customer profile
    const url = 'https://api.paystack.co/customer'
    const axios_config = {
        method: 'post',
        url,
        headers: {
            'Authorization': `Bearer ${config.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        data: { email, first_name, lastname, phone }
    }
    const api_response = await axios(axios_config)

    // Check if request was unsuccessful
    if (!api_response.data.status) {
        return new Error("An error occured while generating a dedicated Virtual account")
    }

    const { customer_code, id } = api_response.data.data

    // Update users saved record
    const users_data = await User.findOne({ email }).populate('rider')
    if (!users_data) { return new Error('User does not exist') }

    const rider = users_data.rider.populate('dedicated_virtual_account')
    let rider_dva = rider.dedicated_virtual_account
    if (!rider_dva) {
        rider_dva = await DedicatedVirtualAccount.create({ rider: rider._id, user: rider.user })
    }

    // Update riders dedicated virtual account data
    await rider_dva.updateOne({ customer_code, customer_id: id })

    return rider_dva
}

/**
 * Create New Dedicated Virtual Account data
 * 
 * @param {Object} data
 * @param {string} data.email,
 * @param {string} data.first_name,
 * @param {string} data.middle_name,
 * @param {string} data.last_name,
 * @param {number} data.phone
 * @param {string} data.preferred_bank
 *  
 * @returns {Object} Dedicated Virtual Account data
 */
async function ceateDedicatedVirtualAccount(data) {
    const { email, preferred_bank } = data

    const user = await User.findOne({ email }).populate('rider')
    if (!user) { return new Error('User does not exist') }

    let rider = user.rider
    if (!rider) { return new Error('User is not a rider')}

    rider = await user.rider.populate('dedicated_virtuial_account')

    let riders_dva = rider.dedicated_virtual_account

    // Send request to paystack API to generate Dedicated virtual account
    const PAYSTACK_DVA_URL = 'https://api.paystack.co/dedicated_account/'
    const axios_config = {
        method: 'post',
        url: PAYSTACK_DVA_URL,
        headers: {
            'Authorization': `Bearer ${config.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        data: {
            customer: riders_dva.customer_code,
            preferred_bank: preferred_bank || config.DVA_PREFERRED_BANK || 'access-bank'
        }
    }
    const api_response = await axios(axios_config)

    // Check if request was successful
    if (!api_response.data.status) {
        return new Error("An error occured while generating a dedicated Virtual account")
    }

    const created_dva = api_response.data.data

    // Update riders dedicated virtual account
   riders_dva =  riders_dva.updateOne({
        account_name: created_dva.account_name,
        account_number: created_dva.account_number,
        bank_name: created_dva.bank.name,
        bank_id: created_dva.back.id
    })


    return riders_dva
}
