const env = require('../config.env');

const appConfig = {
    development: {
        companyName: 'SDW',
        logo: 'public/testserver_logo.jpeg',
        email:'sales@sdw-ds.com',
        phone: '0044 20 3627 0522',
        address: 'Office No 19, Floor 2, Al Arif Shipping Building, Dubai UAE',
    },
    production: {
        companyName: 'Nabco',
        logo: 'public/nabco.jpg',
        email: 'info@nabcouk.com',
        phone: '01727 841 828',
        address: 'Unit 5a, Brick Knoll Park, Ashley Road, St Albans, Herts, AL1 5UG, United Kingdom',
    }
}
const currentConfig = appConfig[env.APP_ENV]
module.exports = currentConfig;
