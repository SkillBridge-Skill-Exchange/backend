require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI).then(async () => {
    require("./src/models");
    const User = require("./src/models/User");
    const jwt = require("jsonwebtoken");
    
    // Simulate frontend API layer manually via HTTP
    const http = require("http");
    
    // Test for Kolla
    const ko = await User.findOne({name: /KOLLA/});
    const token = jwt.sign({id: ko._id}, process.env.JWT_SECRET);
    
    const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/requests',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    }, res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
            console.log("STATUS:", res.statusCode);
            const data = JSON.parse(body);
            console.log("SENT:", data.data?.sent?.length);
            console.log("RECEIVED:", data.data?.received?.length);
            process.exit(0);
        });
    });
    req.on('error', e => console.error(e));
    req.end();
});
