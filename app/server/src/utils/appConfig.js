const env = require('../config.env');

const appConfig = {
    development: {
        companyName: 'Nabco',
        logo: 'public/nabco.jpg',
        email: 'info@nabcouk.com',
        phone: '01727 841 828',
        address: 'Unit 5a, Brick Knoll Park, Ashley Road, St Albans, Herts, AL1 5UG, United Kingdom',
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
